// RF23, RF31: público-alvo e vigência das missões. Mantém, com Admin SDK, os campos de servidor
// da missão (o client não pode escrevê-los — firestore.rules):
//   - `leitoresIds`: quem pode ler a missão. Mesmo padrão de `sessoes` e `classificacoes` (ver
//     docs/decisoes-tecnicas.md): a regra de leitura não consegue checar vínculo, matrícula nem
//     `request.time` numa consulta de lista, então a lista de leitores fica no próprio documento.
//     Vigente: o público-alvo inteiro. Fora da vigência ou desativada: só quem já concluiu.
//   - `situacao`: 'agendada' | 'vigente' | 'encerrada' | 'inativa', no último recálculo.
//   - `alunosNotificadosIds`: quem já recebeu o aviso de nova missão (RF31) — o aviso sai uma vez
//     por aluno, quando a missão fica vigente para ele (criação, início da vigência, reativação ou
//     aluno que entrou no público depois).
//
// Recalculado quando a missão muda, quando um vínculo de aluno com o responsável entra ou sai de
// 'aceito', quando uma matrícula na turma-alvo muda, quando uma conclusão muda fora da vigência e,
// uma vez por dia (00:05), para virar a situação das missões cuja vigência começou ou terminou.
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import {
  getFirestore, FieldValue, Timestamp, type Firestore, type DocumentReference, type DocumentData,
} from 'firebase-admin/firestore';
import { alunosVinculados } from './classificacao';
import { FUSO } from './datas';
import { notificar } from './notificacoes';
import {
  leitoresDaMissao, publicoDaMissao, situacaoDaMissao, type MissaoParaRegras,
} from './missoesRegras';

export const CAMPOS_DO_SERVIDOR = ['leitoresIds', 'situacao', 'alunosNotificadosIds'];

function ms(valor: unknown): number | null {
  return valor instanceof Timestamp ? valor.toMillis() : null;
}

export function paraRegras(m: DocumentData): MissaoParaRegras {
  return {
    ativa: m.ativa,
    publicoAlvo: m.publicoAlvo,
    turmaId: m.turmaId,
    alunosAlvoIds: m.alunosAlvoIds,
    vigenciaInicioMs: ms(m.vigenciaInicio),
    vigenciaFimMs: ms(m.vigenciaFim),
    criadoEmMs: ms(m.criadoEm),
  };
}

async function matriculadosNaTurma(db: Firestore, turmaId: string | undefined): Promise<string[]> {
  if (!turmaId) return [];
  const snap = await db.collection('matriculas').where('turmaId', '==', turmaId).where('status', '==', 'ativa').get();
  return snap.docs.map((d) => d.data().alunoId as string);
}

// Público-alvo efetivo de uma missão, a partir dos vínculos e matrículas atuais
export async function publicoAtual(db: Firestore, m: DocumentData): Promise<string[]> {
  const regras = paraRegras(m);
  const [vinculados, matriculados] = await Promise.all([
    alunosVinculados(db, m.responsavelId),
    regras.publicoAlvo === 'turma' ? matriculadosNaTurma(db, regras.turmaId) : Promise.resolve([]),
  ]);
  return publicoDaMissao(regras, vinculados, matriculados);
}

function mesmaLista(a: unknown, b: string[]): boolean {
  return Array.isArray(a) && a.length === b.length && [...a].sort().every((id, i) => id === b[i]);
}

export async function sincronizarMissao(db: Firestore, ref: DocumentReference, agoraMs = Date.now()): Promise<void> {
  const snap = await ref.get();
  const m = snap.data();
  if (!m) return;
  const situacao = situacaoDaMissao(paraRegras(m), agoraMs);
  const publico = await publicoAtual(db, m);
  let concluintes: string[] = [];
  if (situacao !== 'vigente') {
    const progresso = await db.collection('missoesProgresso')
      .where('missaoId', '==', ref.id).where('concluida', '==', true).get();
    concluintes = progresso.docs.map((p) => p.data().alunoId as string);
  }
  const leitores = leitoresDaMissao(situacao, publico, concluintes).sort();

  const mudancas: Record<string, unknown> = {};
  if (!mesmaLista(m.leitoresIds, leitores)) mudancas.leitoresIds = leitores;
  if (m.situacao !== situacao) mudancas.situacao = situacao;
  if (Object.keys(mudancas).length > 0) await ref.update(mudancas);

  if (situacao === 'vigente') await avisarNovaMissao(db, ref, m, publico);
}

// RF31: aviso de nova missão só para o público-alvo, uma vez por aluno. A transação reserva os
// destinatários antes do envio, então dois gatilhos simultâneos não avisam o mesmo aluno duas vezes.
async function avisarNovaMissao(db: Firestore, ref: DocumentReference, m: DocumentData, publico: string[]): Promise<void> {
  const novos = await db.runTransaction(async (t) => {
    const avisados: string[] = (await t.get(ref)).data()?.alunosNotificadosIds ?? [];
    const pendentes = publico.filter((id) => !avisados.includes(id));
    if (pendentes.length > 0) t.update(ref, { alunosNotificadosIds: FieldValue.arrayUnion(...pendentes) });
    return pendentes;
  });
  if (novos.length === 0) return;
  await notificar(db, novos, 'novaMissao', {
    titulo: 'Nova missão',
    corpo: `${m.titulo} — vale ${m.pontos} pts.`,
    dados: { tela: 'Missoes' },
  });
}

function iguais(a: unknown, b: unknown): boolean {
  if (a instanceof Timestamp && b instanceof Timestamp) return a.isEqual(b);
  return JSON.stringify(a) === JSON.stringify(b);
}

// Missão criada ou alterada pelo responsável. Escritas que só mexem nos campos de servidor (feitas
// por esta própria função) são ignoradas, senão o gatilho se dispararia em laço.
export const sincronizarMissaoNaEscrita = onDocumentWritten('missoes/{missaoId}', async (event) => {
  const antes = event.data?.before.data();
  const depois = event.data?.after.data();
  if (!depois || !event.data?.after.exists) return;
  if (antes) {
    const chaves = new Set([...Object.keys(antes), ...Object.keys(depois)]);
    const mudouAlgo = [...chaves].some((k) => !CAMPOS_DO_SERVIDOR.includes(k) && !iguais(antes[k], depois[k]));
    if (!mudouAlgo) return;
  }
  await sincronizarMissao(getFirestore(), event.data.after.ref);
});

async function sincronizarVarias(db: Firestore, refs: DocumentReference[]): Promise<void> {
  // Sequencial: poucas missões por responsável, e evita disputa nas transações de aviso
  for (const ref of refs) {
    // eslint-disable-next-line no-await-in-loop
    await sincronizarMissao(db, ref);
  }
}

export const atualizarMissoesNoVinculo = onDocumentWritten('vinculos/{vinculoId}', async (event) => {
  const antes = event.data?.before.data();
  const depois = event.data?.after.data();
  const vinculo = depois ?? antes;
  if (!vinculo || vinculo.perfilSolicitante !== 'aluno') return;
  if ((antes?.status === 'aceito') === (depois?.status === 'aceito')) return;
  const db = getFirestore();
  const missoes = await db.collection('missoes').where('responsavelId', '==', vinculo.destinatarioId).get();
  await sincronizarVarias(db, missoes.docs.map((d) => d.ref));
});

export const atualizarMissoesNaMatricula = onDocumentWritten('matriculas/{matriculaId}', async (event) => {
  const antes = event.data?.before.data();
  const depois = event.data?.after.data();
  const matricula = depois ?? antes;
  if (!matricula) return;
  if ((antes?.status === 'ativa') === (depois?.status === 'ativa')) return;
  const db = getFirestore();
  const missoes = await db.collection('missoes')
    .where('responsavelId', '==', matricula.responsavelId)
    .where('turmaId', '==', matricula.turmaId)
    .get();
  await sincronizarVarias(db, missoes.docs.map((d) => d.ref));
});

// Conclusão que muda com a missão fora da vigência (ex.: check-in feito dentro da vigência e
// validado depois do fim): o aluno entra ou sai dos leitores do histórico.
export const atualizarMissaoNaConclusao = onDocumentWritten('missoesProgresso/{progressoId}', async (event) => {
  const antes = event.data?.before.data();
  const depois = event.data?.after.data();
  const progresso = depois ?? antes;
  if (!progresso || (antes?.concluida === true) === (depois?.concluida === true)) return;
  const db = getFirestore();
  const ref = db.doc(`missoes/${progresso.missaoId}`);
  const missao = (await ref.get()).data();
  if (!missao || situacaoDaMissao(paraRegras(missao), Date.now()) === 'vigente') return;
  await sincronizarMissao(db, ref);
});

// Núcleo do agendamento diário, exportado para o teste chamar direto (o emulador não dispara
// agendamentos). Recalcula as missões cuja situação mudou desde o último recálculo — inclusive as
// antigas, que ainda não têm `situacao` (migração automática, ver scripts/migrar-missoes-publico.cjs).
export async function atualizarSituacaoDasMissoes(agora: Date, db: Firestore = getFirestore()): Promise<number> {
  const snap = await db.collection('missoes').where('ativa', '==', true).get();
  const mudaram = snap.docs.filter((d) => d.data().situacao !== situacaoDaMissao(paraRegras(d.data()), agora.getTime()));
  for (const d of mudaram) {
    // eslint-disable-next-line no-await-in-loop
    await sincronizarMissao(db, d.ref, agora.getTime());
  }
  return mudaram.length;
}

export const virarSituacaoDasMissoes = onSchedule({ schedule: '5 0 * * *', timeZone: FUSO }, async () => {
  await atualizarSituacaoDasMissoes(new Date());
});
