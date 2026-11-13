// RF18, RN01: progresso das missões e crédito dos pontos de missão. Duas funções:
//
// 1. atualizarMissoesNoCheckIn — quando um check-in entra ou sai de 'validado', recalcula do zero
//    o progresso do aluno em todas as missões AUTOMÁTICAS ativas do responsável (presença,
//    pontuação e sequência por sessão agendada, RF21). RF23: só para alunos do público-alvo da
//    missão, e contando só os treinos DENTRO da vigência (missão antiga, sem vigência: desde a
//    criação). Vale o horário do treino, não o da validação: um check-in feito no último dia e
//    validado depois do fim ainda conta. Por recalcular do zero, um estorno também desfaz a conclusão.
// 2. creditarPontosDaMissao — quando um documento de missoesProgresso muda (pela função acima ou
//    pelo responsável marcando uma missão personalizada), credita os pontos da missão ao concluir
//    e estorna ao desconcluir. `pontosCreditados` guarda o que já foi creditado, então o gatilho
//    pode rodar mais de uma vez sem creditar em dobro.
//
// As duas rodam com Admin SDK. O aluno continua sem permissão de escrever o próprio progresso
// (firestore.rules); o responsável só escreve progresso de missão personalizada.
import { onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import {
  getFirestore, FieldValue, Timestamp, type Firestore, type DocumentData,
} from 'firebase-admin/firestore';
import { periodoDe } from './datas';
import { maiorSequenciaDeSessoes, type SessaoDaSequencia } from './sequencia';
import { dentroDaVigencia, type MissaoParaRegras } from './missoesRegras';
import { paraRegras } from './missoesPublico';

const TIPOS_AUTOMATICOS = ['presenca', 'pontuacao', 'sequencia'];

interface DadosDoAluno {
  validados: DocumentData[];               // check-ins validados no escopo
  statusPorSessao: Map<string, string>;    // status do check-in de cada sessão (qualquer status)
  sessoes: (SessaoDaSequencia & { inicioMs: number })[];
}

// RF23: tudo conta só dentro da vigência da missão
function valorDaMissao(tipo: string, dados: DadosDoAluno, missao: MissaoParaRegras, agoraMs: number): number {
  const validados = dados.validados.filter((c) => dentroDaVigencia(missao, (c.dataHora as Timestamp).toMillis()));
  if (tipo === 'presenca') return validados.length;
  if (tipo === 'pontuacao') return validados.reduce((soma, c) => soma + (c.pontos ?? 0), 0);
  // RF21: sequência por sessão agendada do aluno neste escopo (functions/src/sequencia.ts)
  return maiorSequenciaDeSessoes(dados.sessoes.filter((s) => dentroDaVigencia(missao, s.inicioMs)), dados.statusPorSessao, agoraMs);
}

// RF23: o aluno está no público-alvo da missão? Lido direto dos vínculos e da matrícula (e não de
// `leitoresIds`, que fica vazio fora da vigência e pode chegar uns instantes depois).
async function alunoNoPublico(db: Firestore, alunoId: string, missao: DocumentData, responsaveisIds: string[]): Promise<boolean> {
  if (!responsaveisIds.includes(missao.responsavelId)) return false;
  const tipo = missao.publicoAlvo ?? 'todos';
  if (tipo === 'todos') return true;
  if (tipo === 'alunos') return ((missao.alunosAlvoIds ?? []) as string[]).includes(alunoId);
  if (!missao.turmaId) return false;
  const matricula = (await db.doc(`matriculas/${missao.turmaId}_${alunoId}`).get()).data();
  return matricula?.status === 'ativa';
}

async function recalcularMissoesDoAluno(db: Firestore, alunoId: string, responsavelId: string): Promise<void> {
  const [missoesSnap, checkinsSnap] = await Promise.all([
    db.collection('missoes').where('responsavelId', '==', responsavelId).where('ativa', '==', true).get(),
    db.collection('checkins')
      .where('alunoId', '==', alunoId)
      .where('responsavelId', '==', responsavelId)
      .get(),
  ]);
  const automaticas = missoesSnap.docs.filter((m) => TIPOS_AUTOMATICOS.includes(m.data().tipo));
  if (automaticas.length === 0) return;
  const responsaveisIds: string[] = (await db.doc(`usuarios/${alunoId}/privado/vinculos`).get()).data()?.responsaveisIds ?? [];
  const noPublico = await Promise.all(automaticas.map((m) => alunoNoPublico(db, alunoId, m.data(), responsaveisIds)));
  const missoes = automaticas.filter((_, i) => noPublico[i]);
  if (missoes.length === 0) return;
  const checkins = checkinsSnap.docs.map((c) => c.data());
  const agora = Timestamp.now();

  // Sessões só são lidas se houver missão de sequência
  let sessoes: DadosDoAluno['sessoes'] = [];
  if (missoes.some((m) => m.data().tipo === 'sequencia')) {
    const sessoesSnap = await db.collection('sessoes')
      .where('leitoresIds', 'array-contains', alunoId)
      .where('responsavelId', '==', responsavelId)
      .get();
    sessoes = sessoesSnap.docs
      .map((s) => ({
        id: s.id,
        status: s.data().status as string,
        janelaFimMs: (s.data().janelaCheckInFim as Timestamp).toMillis(),
        inicioMs: (s.data().inicio as Timestamp).toMillis(),
      }))
      .filter((s) => s.inicioMs <= agora.toMillis());
  }
  const dados: DadosDoAluno = {
    validados: checkins.filter((c) => c.status === 'validado'),
    statusPorSessao: new Map(checkins.map((c) => [c.sessaoId as string, c.status as string])),
    sessoes,
  };

  await Promise.all(missoes.map(async (missaoDoc) => {
    const missao = missaoDoc.data();
    const valor = valorDaMissao(missao.tipo, dados, paraRegras(missao), agora.toMillis());
    const progressoAtual = Math.min(valor, missao.meta);
    const concluida = valor >= missao.meta;

    const ref = db.doc(`missoesProgresso/${missaoDoc.id}_${alunoId}`);
    const atual = (await ref.get()).data();
    if (atual && atual.progressoAtual === progressoAtual && atual.concluida === concluida) return;
    if (!atual && progressoAtual === 0) return;

    await ref.set({
      id: ref.id,
      missaoId: missaoDoc.id,
      alunoId,
      responsavelId,
      progressoAtual,
      concluida,
      dataConclusao: concluida ? (atual?.dataConclusao ?? agora) : FieldValue.delete(),
      atualizadoEm: agora,
    }, { merge: true });
  }));
}

export const atualizarMissoesNoCheckIn = onDocumentUpdated(
  'checkins/{checkinId}',
  async (event) => {
    const antes = event.data?.before.data();
    const depois = event.data?.after.data();
    if (!antes || !depois) return;
    const mudouValidacao = (antes.status === 'validado') !== (depois.status === 'validado');
    if (!mudouValidacao && antes.pontos === depois.pontos) return;
    await recalcularMissoesDoAluno(getFirestore(), depois.alunoId, depois.responsavelId);
  },
);

export const creditarPontosDaMissao = onDocumentWritten(
  'missoesProgresso/{progressoId}',
  async (event) => {
    // Apagado: só acontece na exclusão de conta do aluno, que já apaga as classificações dele
    if (!event.data?.after.exists) return;
    const db = getFirestore();
    const progressoRef = event.data.after.ref;

    await db.runTransaction(async (t) => {
      const progressoSnap = await t.get(progressoRef);
      const progresso = progressoSnap.data();
      if (!progresso) return;
      const creditados: number = progresso.pontosCreditados ?? 0;

      if (progresso.concluida && creditados === 0) {
        const missao = (await t.get(db.doc(`missoes/${progresso.missaoId}`))).data();
        const pontos: number = missao?.pontos ?? 0;
        if (pontos <= 0) return;
        const periodo = periodoDe(new Date());
        const id = `${progresso.alunoId}_${progresso.responsavelId}_${periodo}`;
        const classificacaoRef = db.doc(`classificacoes/${id}`);
        const classificacao = await t.get(classificacaoRef);
        if (classificacao.exists) {
          t.update(classificacaoRef, { pontos: FieldValue.increment(pontos), atualizadoEm: Timestamp.now() });
        } else {
          t.set(classificacaoRef, {
            id, alunoId: progresso.alunoId, responsavelId: progresso.responsavelId, periodo, pontos, atualizadoEm: Timestamp.now(),
          });
        }
        t.update(progressoRef, { pontosCreditados: pontos, periodoCredito: periodo });
      } else if (!progresso.concluida && creditados > 0) {
        const id = `${progresso.alunoId}_${progresso.responsavelId}_${progresso.periodoCredito}`;
        const classificacaoRef = db.doc(`classificacoes/${id}`);
        const classificacao = await t.get(classificacaoRef);
        if (classificacao.exists) {
          const restante = Math.max(0, (classificacao.data()?.pontos ?? 0) - creditados);
          t.update(classificacaoRef, { pontos: restante, atualizadoEm: Timestamp.now() });
        }
        t.update(progressoRef, { pontosCreditados: 0, periodoCredito: FieldValue.delete() });
      }
    });
  },
);
