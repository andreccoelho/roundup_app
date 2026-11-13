// RF22, RF10: o professor que uma ACADEMIA atribuiu a uma turma precisa ver as matrículas e os check-ins
// dela e validar presença. A regra de leitura de lista não consegue consultar a turma (docs/
// decisoes-tecnicas.md), então o servidor grava `professorId` em cada matrícula e check-in da turma —
// mesmo padrão de `leitoresIds`. O client não escreve esse campo (firestore.rules).
//
// `professorId` só existe quando a turma é de academia E tem professor atribuído diferente do
// responsável. O professor autônomo é o próprio responsável: já tem acesso por `responsavelId`.
//
// Mantido por três gatilhos: matrícula criada, check-in criado e turma que muda de professor (acerta
// todos os registros dela). `reconciliarProfessorDaTurma` também serve à migração dos registros que já
// existiam (scripts/migrar-professor-nos-registros.cjs).
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue, type Firestore, type DocumentData } from 'firebase-admin/firestore';

const TAMANHO_LOTE = 400;

export function professorDaTurma(turma: DocumentData | undefined): string | null {
  const professorId = turma?.professorId;
  if (typeof professorId !== 'string' || professorId === '' || professorId === turma?.responsavelId) return null;
  return professorId;
}

async function aplicarNaCriacao(db: Firestore, ref: FirebaseFirestore.DocumentReference, turmaId: unknown): Promise<void> {
  if (typeof turmaId !== 'string') return;
  const professorId = professorDaTurma((await db.doc(`turmas/${turmaId}`).get()).data());
  if (professorId) await ref.update({ professorId });
}

// Acerta `professorId` de todas as matrículas e check-ins da turma. Devolve quantos documentos mudou.
export async function reconciliarProfessorDaTurma(db: Firestore, turmaId: string): Promise<number> {
  const professorId = professorDaTurma((await db.doc(`turmas/${turmaId}`).get()).data());
  const alvo = professorId ?? FieldValue.delete();
  const [matriculas, checkins] = await Promise.all([
    db.collection('matriculas').where('turmaId', '==', turmaId).get(),
    db.collection('checkins').where('turmaId', '==', turmaId).get(),
  ]);
  const pendentes = [...matriculas.docs, ...checkins.docs].filter((d) => (d.data().professorId ?? null) !== professorId);
  for (let i = 0; i < pendentes.length; i += TAMANHO_LOTE) {
    const lote = db.batch();
    pendentes.slice(i, i + TAMANHO_LOTE).forEach((d) => lote.update(d.ref, { professorId: alvo }));
    // eslint-disable-next-line no-await-in-loop
    await lote.commit();
  }
  return pendentes.length;
}

export const definirProfessorNaMatricula = onDocumentCreated('matriculas/{matriculaId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  await aplicarNaCriacao(getFirestore(), snap.ref, snap.data().turmaId);
});

export const definirProfessorNoCheckin = onDocumentCreated('checkins/{checkinId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  await aplicarNaCriacao(getFirestore(), snap.ref, snap.data().turmaId);
});

export const atualizarProfessorNaTurma = onDocumentUpdated('turmas/{turmaId}', async (event) => {
  const antes = event.data?.before.data();
  const depois = event.data?.after.data();
  if (!antes || !depois) return;
  if (professorDaTurma(antes) === professorDaTurma(depois)) return;
  await reconciliarProfessorDaTurma(getFirestore(), event.params.turmaId);
});
