// RF25, RN03: a graduação registrada pelo professor/academia (documento imutável em `graduacoes`)
// vira a graduação atual do aluno em `usuarios/{alunoId}.graduacoes[modalidade]`. O client do
// professor não pode escrever no documento do aluno (firestore.rules), então a projeção é feita aqui
// com o Admin SDK — e só a partir de um registro humano, nunca por cálculo de pontos.
// `faixaOuGrau` passa a refletir a graduação mais recente (selos e telas que mostram uma só).
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const aplicarGraduacaoNoPerfil = onDocumentCreated('graduacoes/{graduacaoId}', async (event) => {
  const g = event.data?.data();
  if (!g?.alunoId || !g.modalidade || !g.grau) return;
  // set+merge com objeto aninhado trata o nome da modalidade como chave literal (sem interpretar pontos)
  await getFirestore()
    .doc(`usuarios/${g.alunoId}`)
    .set({ graduacoes: { [g.modalidade]: g.grau }, faixaOuGrau: g.grau, atualizadoEm: FieldValue.serverTimestamp() }, { merge: true });
});
