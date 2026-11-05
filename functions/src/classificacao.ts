// RN09, RNF11: mantém `leitoresIds` dos documentos de `classificacoes` — quem pode ler a
// pontuação de um aluno num escopo. Mesmo motivo de `leitoresIds` em sessões (ver
// docs/decisoes-tecnicas.md): a regra de leitura não pode checar vínculo por get() numa consulta
// de lista, então a lista de leitores fica desnormalizada no próprio documento.
//
// Quem lê o documento do aluno A no escopo S:
// - A participa da classificação (padrão) e tem vínculo aceito com S: S + todos os alunos com
//   vínculo aceito com S;
// - A não participa (RNF11) ou não tem mais vínculo com S: só S e o próprio A — ele some do
//   ranking dos outros, mas continua vendo a própria pontuação.
//
// Recalculado quando o documento nasce, quando um vínculo de aluno com S entra ou sai de
// 'aceito' e quando o aluno muda a preferência `participaClassificacao`.
import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore, type Firestore, type DocumentSnapshot } from 'firebase-admin/firestore';

// Limite do WriteBatch do Firestore
const TAMANHO_LOTE = 500;

async function alunosVinculados(db: Firestore, responsavelId: string): Promise<string[]> {
  const snap = await db.collection('vinculos')
    .where('destinatarioId', '==', responsavelId)
    .where('status', '==', 'aceito')
    .where('perfilSolicitante', '==', 'aluno')
    .get();
  return snap.docs.map((d) => d.data().solicitanteId as string);
}

async function quemParticipa(db: Firestore, alunoIds: string[]): Promise<Set<string>> {
  if (alunoIds.length === 0) return new Set();
  const snaps = await db.getAll(...alunoIds.map((id) => db.doc(`usuarios/${id}`)));
  return new Set(snaps.filter((s) => s.exists && s.data()?.participaClassificacao !== false).map((s) => s.id));
}

function leitoresPara(responsavelId: string, alunoId: string, vinculados: string[], participantes: Set<string>): string[] {
  if (participantes.has(alunoId) && vinculados.includes(alunoId)) {
    return [responsavelId, ...vinculados];
  }
  return [responsavelId, alunoId];
}

function mesmosLeitores(a: unknown, b: string[]): boolean {
  return Array.isArray(a) && a.length === b.length && a.every((id, i) => id === b[i]);
}

async function atualizarDocumentos(db: Firestore, responsavelId: string, docs: DocumentSnapshot[]): Promise<void> {
  if (docs.length === 0) return;
  const vinculados = await alunosVinculados(db, responsavelId);
  const alunoIds = [...new Set(docs.map((d) => d.data()?.alunoId as string))];
  const participantes = await quemParticipa(db, alunoIds);

  const mudancas = docs
    .map((d) => ({ ref: d.ref, atual: d.data()?.leitoresIds, novo: leitoresPara(responsavelId, d.data()?.alunoId, vinculados, participantes) }))
    .filter((m) => !mesmosLeitores(m.atual, m.novo));

  for (let i = 0; i < mudancas.length; i += TAMANHO_LOTE) {
    const batch = db.batch();
    mudancas.slice(i, i + TAMANHO_LOTE).forEach((m) => batch.update(m.ref, { leitoresIds: m.novo }));
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
  }
}

async function recalcularEscopo(db: Firestore, responsavelId: string): Promise<void> {
  const snap = await db.collection('classificacoes').where('responsavelId', '==', responsavelId).get();
  await atualizarDocumentos(db, responsavelId, snap.docs);
}

export const definirLeitoresDaClassificacao = onDocumentCreated(
  'classificacoes/{classificacaoId}',
  async (event) => {
    const snap = event.data;
    const responsavelId = snap?.data().responsavelId as string | undefined;
    if (!snap || !responsavelId) return;
    await atualizarDocumentos(getFirestore(), responsavelId, [snap]);
  },
);

export const atualizarLeitoresNoVinculo = onDocumentWritten(
  'vinculos/{vinculoId}',
  async (event) => {
    const antes = event.data?.before.data();
    const depois = event.data?.after.data();
    const vinculo = depois ?? antes;
    if (!vinculo || vinculo.perfilSolicitante !== 'aluno') return;
    if ((antes?.status === 'aceito') === (depois?.status === 'aceito')) return;
    await recalcularEscopo(getFirestore(), vinculo.destinatarioId);
  },
);

export const atualizarLeitoresNaParticipacao = onDocumentUpdated(
  'usuarios/{usuarioId}',
  async (event) => {
    const antes = event.data?.before.data();
    const depois = event.data?.after.data();
    if (!antes || !depois) return;
    if ((antes.participaClassificacao !== false) === (depois.participaClassificacao !== false)) return;

    const db = getFirestore();
    const docs = await db.collection('classificacoes').where('alunoId', '==', event.params.usuarioId).get();
    const escopos = [...new Set(docs.docs.map((d) => d.data().responsavelId as string))];
    await Promise.all(escopos.map((responsavelId) => recalcularEscopo(db, responsavelId)));
  },
);
