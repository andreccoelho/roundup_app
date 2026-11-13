// RF25, RN03: a graduação registrada pelo professor/academia (documento imutável em `graduacoes`)
// vira a graduação atual do aluno em `usuarios/{alunoId}.graduacoes[modalidade]`. O client do
// professor não pode escrever no documento do aluno (firestore.rules), então a projeção é feita aqui
// com o Admin SDK — e só a partir de um registro humano, nunca por cálculo de pontos.
// `faixaOuGrau` passa a refletir a graduação mais recente (selos e telas que mostram uma só).
// RF33: com a faixa da estrutura do responsável (faixaId), grava também a graduação estruturada em
// `faixasEstruturadas[modalidade]`; graduação em texto livre (modalidade "Outra") apaga a estruturada
// daquela modalidade, para não ficar uma faixa velha ao lado do texto novo.
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const aplicarGraduacaoNoPerfil = onDocumentCreated('graduacoes/{graduacaoId}', async (event) => {
  const g = event.data?.data();
  if (!g?.alunoId || !g.modalidade || !g.grau) return;
  const estruturada = typeof g.faixaId === 'string'
    ? {
      faixaId: g.faixaId,
      faixa: typeof g.faixaNome === 'string' ? g.faixaNome : g.grau,
      cor: g.faixaCor ?? 'cinza',
      grau: Number.isInteger(g.grauNumero) ? g.grauNumero : 0,
      responsavelId: g.responsavelId,
    }
    : FieldValue.delete();
  // set+merge com objeto aninhado trata o nome da modalidade como chave literal (sem interpretar pontos)
  await getFirestore()
    .doc(`usuarios/${g.alunoId}`)
    .set({
      graduacoes: { [g.modalidade]: g.grau },
      faixasEstruturadas: { [g.modalidade]: estruturada },
      faixaOuGrau: g.grau,
      atualizadoEm: FieldValue.serverTimestamp(),
    }, { merge: true });
});
