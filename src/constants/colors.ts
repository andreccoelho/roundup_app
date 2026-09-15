// Paleta monocromática da identidade visual RoundUp — ver DESIGN_BRIEF.md
// Cor só sai da escala de cinza para os dois estados funcionais (checkinValidado, alerta);
// nunca é usada como acento decorativo.
// Fonte única dos valores: src/theme/tokens.ts — este arquivo só reexporta, para não quebrar os
// imports já existentes (`import { Colors } from '../constants/colors'`) nas telas do Ciclo 1.
export { Cores as Colors } from '../theme/tokens';
