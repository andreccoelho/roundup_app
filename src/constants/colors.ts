// Paleta monocromática da identidade visual RoundUp — ver DESIGN_BRIEF.md
// Cor só sai da escala de cinza para os dois estados funcionais (checkinValidado, alerta);
// nunca é usada como acento decorativo.
export const Colors = {
  preto: '#0A0A0A',
  branco: '#FFFFFF',
  cinzaEscuro: '#2A2A2A',   // superfícies escuras elevadas (ex: card de faixa)
  cinzaMedio: '#6B6B6B',    // texto secundário
  cinzaClaro: '#B3B3B3',    // texto terciário / ícones inativos
  cinzaBorda: '#D9D9D9',    // linhas finas de separação (não bordas de card)
  cinzaFundo: '#F4F4F4',    // fundo de tela — não branco puro, para os cards brancos se destacarem

  checkinValidado: '#2E7D32', // único uso de verde: sucesso de check-in
  alerta: '#B3261E',          // único uso de vermelho: janela de check-in fechada / rejeitado
} as const;
