// RF18, RN01: progresso das missões e crédito dos pontos de missão. Duas funções:
//
// 1. atualizarMissoesNoCheckIn — quando um check-in entra ou sai de 'validado', recalcula do zero
//    o progresso do aluno em todas as missões AUTOMÁTICAS ativas do responsável (presença,
//    pontuação e sequência), contando só check-ins validados a partir da criação da missão. Por
//    recalcular do zero, um estorno de validação também desfaz a conclusão.
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

const TIPOS_AUTOMATICOS = ['presenca', 'pontuacao', 'sequencia'];

// RN04: mesmo "AAAA-MM" de periodoDe() no app, mas com o fuso fixo — a function roda em UTC
const FUSO = 'America/Sao_Paulo';

export function periodoDe(data: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit' }).formatToParts(data);
  const ano = partes.find((p) => p.type === 'year')?.value;
  const mes = partes.find((p) => p.type === 'month')?.value;
  return `${ano}-${mes}`;
}

function diaLocal(data: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(data);
}

const UM_DIA = 24 * 60 * 60 * 1000;

// RF21: maior sequência de dias consecutivos com check-in validado (mesmo critério de dia civil
// de calcularSequencia() no app). A maior, não a atual: uma missão de sequência concluída não
// volta a "em curso" só porque a sequência quebrou depois.
export function maiorSequencia(datas: Date[]): number {
  const dias = [...new Set(datas.map(diaLocal))].sort();
  let maior = 0;
  let atual = 0;
  let anterior: number | null = null;
  for (const dia of dias) {
    const instante = Date.parse(`${dia}T00:00:00Z`);
    atual = anterior !== null && instante - anterior === UM_DIA ? atual + 1 : 1;
    maior = Math.max(maior, atual);
    anterior = instante;
  }
  return maior;
}

function valorDaMissao(tipo: string, checkins: DocumentData[]): number {
  if (tipo === 'presenca') return checkins.length;
  if (tipo === 'pontuacao') return checkins.reduce((soma, c) => soma + (c.pontos ?? 0), 0);
  return maiorSequencia(checkins.map((c) => (c.dataHora as Timestamp).toDate()));
}

async function recalcularMissoesDoAluno(db: Firestore, alunoId: string, responsavelId: string): Promise<void> {
  const [missoesSnap, checkinsSnap] = await Promise.all([
    db.collection('missoes').where('responsavelId', '==', responsavelId).where('ativa', '==', true).get(),
    db.collection('checkins')
      .where('alunoId', '==', alunoId)
      .where('responsavelId', '==', responsavelId)
      .where('status', '==', 'validado')
      .get(),
  ]);
  const missoes = missoesSnap.docs.filter((m) => TIPOS_AUTOMATICOS.includes(m.data().tipo));
  if (missoes.length === 0) return;
  const checkins = checkinsSnap.docs.map((c) => c.data());
  const agora = Timestamp.now();

  await Promise.all(missoes.map(async (missaoDoc) => {
    const missao = missaoDoc.data();
    const desde = (missao.criadoEm as Timestamp | undefined)?.toMillis() ?? 0;
    const valor = valorDaMissao(missao.tipo, checkins.filter((c) => (c.dataHora as Timestamp).toMillis() >= desde));
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
