// Três registros tipográficos, ver DESIGN_BRIEF.md:
// - placar: grotesco condensado (Oswald) para números e headlines de placar (XP, %, contagens)
// - display: Homebase (fonte da marca), só lettering "RNDP"/wordmark e título de tela
// - corpo: sans neutro do sistema — nem Oswald nem Homebase aparecem aqui
// Fonte única dos valores: src/theme/tokens.ts — este arquivo só reexporta, para não quebrar os
// imports já existentes (`import { FontFamily, FontSize } from '../constants/typography'`).
export { FamiliaFonte as FontFamily, TamanhoFonte as FontSize } from '../theme/tokens';
