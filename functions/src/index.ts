// RF14, RNF04: sincroniza leitoresIds das sessões futuras de uma turma quando uma matrícula
// nasce ou muda de status. Existe como Cloud Function (Admin SDK, ignora firestore.rules)
// porque o client não consegue resolver isso sozinho: adicionar o aluno a leitoresIds de uma
// sessão futura JÁ EXISTENTE exigiria uma consulta por turmaId, e essa consulta só é provada
// segura pela regra de leitura de `sessoes` (meuId() in leitoresIds) se o aluno já estivesse
// em leitoresIds — o que ainda não está. Ver docs/decisoes-tecnicas.md para o histórico
// completo da tentativa client-only e por que ela não fecha para o caso de adicionar.
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import {
  getFirestore, FieldValue, Timestamp,
  type QueryDocumentSnapshot, type DocumentData,
} from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

// Limite do WriteBatch do Firestore
const TAMANHO_LOTE = 500;

interface Matricula {
  turmaId: string;
  alunoId: string;
  status: 'ativa' | 'inativa';
}

async function sincronizarLeitoresDasSessoesFuturas(
  turmaId: string,
  alunoId: string,
  operacao: 'adicionar' | 'remover',
): Promise<void> {
  const agora = Timestamp.now();
  const sessoesSnap = await db.collection('sessoes')
    .where('turmaId', '==', turmaId)
    .where('inicio', '>=', agora)
    .where('status', 'in', ['agendada', 'aberta'])
    .get();

  if (sessoesSnap.empty) return;

  const docs = sessoesSnap.docs;
  const lotes: QueryDocumentSnapshot<DocumentData>[][] = [];
  for (let i = 0; i < docs.length; i += TAMANHO_LOTE) {
    lotes.push(docs.slice(i, i + TAMANHO_LOTE));
  }

  if (lotes.length > 1) {
    // Log de erro claro, não falha silenciosa — cobertura de retry/fila é Ciclo 4
    logger.error(
      `sincronizarLeitoresDasSessoesFuturas: turma ${turmaId} tem ${docs.length} sessões ` +
      `futuras, acima do limite de um único lote (${TAMANHO_LOTE}). Dividindo em ` +
      `${lotes.length} lotes sequenciais.`,
    );
  }

  for (const lote of lotes) {
    const batch = db.batch();
    lote.forEach((doc) => {
      batch.update(doc.ref, {
        leitoresIds: operacao === 'adicionar'
          ? FieldValue.arrayUnion(alunoId)
          : FieldValue.arrayRemove(alunoId),
      });
    });
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
  }
}

export const sincronizarLeitorNaMatricula = onDocumentCreated(
  'matriculas/{matriculaId}',
  async (event) => {
    const matricula = event.data?.data() as Matricula | undefined;
    if (!matricula || matricula.status !== 'ativa') return;

    await sincronizarLeitoresDasSessoesFuturas(matricula.turmaId, matricula.alunoId, 'adicionar');
  },
);

// Cobre tanto cancelarMatricula (status vira 'inativa', RF14: remove de sessões futuras)
// quanto uma remoção seguida de nova matrícula na mesma turma (matricularAluno reaproveita o
// documento existente e volta o status para 'ativa' via updateDoc/setDoc — não dispara
// onDocumentCreated de novo, só onDocumentUpdated). O script original só descrevia a direção
// 'inativa'; a direção 'ativa' foi adicionada para que reativar uma matrícula cancelada
// sincronize leitoresIds do mesmo jeito que uma matrícula nova.
export const sincronizarLeitorNaAtualizacaoDeMatricula = onDocumentUpdated(
  'matriculas/{matriculaId}',
  async (event) => {
    const antes = event.data?.before.data() as Matricula | undefined;
    const depois = event.data?.after.data() as Matricula | undefined;
    if (!antes || !depois || antes.status === depois.status) return;

    if (depois.status === 'ativa') {
      await sincronizarLeitoresDasSessoesFuturas(depois.turmaId, depois.alunoId, 'adicionar');
    } else if (depois.status === 'inativa') {
      await sincronizarLeitoresDasSessoesFuturas(depois.turmaId, depois.alunoId, 'remover');
    }
  },
);
