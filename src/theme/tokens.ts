// Tokens visuais do RoundUp — direção "Apple" (docs/DESIGN.md). Fonte única: nenhuma tela define
// cor, tamanho de fonte ou raio fora daqui. Dois temas, claro e escuro, seguindo o aparelho; as
// cores chegam aos componentes por useTema()/criarEstilos() (src/theme/tema.tsx), nunca importadas
// direto de uma paleta.
//
// Modelo: cores de sistema do iOS (systemBackground, systemGroupedBackground,
// secondarySystemGroupedBackground, label/secondaryLabel/tertiaryLabel, separator, fill), com dois
// desvios por acessibilidade (WCAG 2.1, 4,5:1 para texto):
//   - texto2/texto3 mais escuros (claro) que secondaryLabel/tertiaryLabel do iOS, que dão 3,4:1;
//   - o vermelho da marca é o tint, em dois tons: `tint` para texto/ícone (5,4 no claro, 6,8 no
//     escuro) e `tintCheio` para fundo de botão com rótulo branco (5,4 nos dois temas).
// Contraste medido (sobre fundo / superfície / preenchimento ou superfície elevada):
//   claro:  texto2 7,3/6,5/6,3 · texto3 5,4/4,8/4,6 · tint 5,4/4,8/4,6 · sucesso 5,4/4,9 ·
//           perigo 5,8/5,2 · ouro 5,7/5,1
//   escuro: texto2 9,5/7,7/6,3 · texto3 7,3/5,9/4,9 · tint 6,8/5,5/4,5 · sucesso 10,4/8,4 ·
//           perigo 7,5/6,0 · ouro 14,9/12,1
// Tabela completa em docs/redesign-apple/contraste.md.

export interface PaletaCores {
  fundo: string; // systemBackground — telas sem lista agrupada
  fundoAgrupado: string; // systemGroupedBackground — telas com listas agrupadas
  superficie: string; // secondarySystemGroupedBackground — células, cartões
  superficieElevada: string; // sheet, alerta, toast
  texto: string; // label
  texto2: string; // secondaryLabel (ajustado para 4,5:1)
  texto3: string; // tertiaryLabel (ajustado para 4,5:1) — placeholder, metadado
  separador: string; // separator, translúcido
  separadorOpaco: string; // opaqueSeparator — onde a transparência somaria camadas
  preenchimento: string; // fill — campos, botão cinza, trilhas
  tint: string; // vermelho da marca como texto/ícone/controle
  tintCheio: string; // fundo de botão cheio (rótulo `sobreTint`)
  tintSuave: string; // fundo de destaque leve (linha do próprio usuário)
  sobreTint: string; // texto/ícone sobre tintCheio, sucessoCheio ou perigo cheio
  sucesso: string;
  sucessoCheio: string;
  perigo: string;
  perigoCheio: string; // fundo de botão destrutivo (rótulo `sobreTint`, 5,8:1)
  ouro: string; // só 1º lugar do ranking e medalha máxima
  controleSelecionado: string; // segmento ativo do controle segmentado
  overlay: string; // fundo atrás de alerta/conquista
  sombra: string;
}

export const CoresClaro: PaletaCores = {
  fundo: '#FFFFFF',
  fundoAgrupado: '#F2F2F7',
  superficie: '#FFFFFF',
  superficieElevada: '#FFFFFF',
  texto: '#000000',
  texto2: '#56565C',
  texto3: '#6A6A70',
  separador: 'rgba(60,60,67,0.29)',
  separadorOpaco: '#C6C6C8',
  preenchimento: 'rgba(120,120,128,0.12)',
  tint: '#CC2A1F',
  tintCheio: '#CC2A1F',
  tintSuave: 'rgba(204,42,31,0.08)',
  sobreTint: '#FFFFFF',
  sucesso: '#177A34',
  sucessoCheio: '#1A7F37',
  perigo: '#C4231B',
  perigoCheio: '#C4231B',
  ouro: '#876000',
  controleSelecionado: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.4)',
  sombra: '#000000',
};

export const CoresEscuro: PaletaCores = {
  fundo: '#000000',
  fundoAgrupado: '#000000',
  superficie: '#1C1C1E',
  superficieElevada: '#2C2C2E',
  texto: '#FFFFFF',
  texto2: '#AEAEB2',
  texto3: '#98989F',
  separador: 'rgba(84,84,88,0.65)',
  separadorOpaco: '#38383A',
  preenchimento: 'rgba(120,120,128,0.32)',
  tint: '#FF5A4F',
  tintCheio: '#CC2A1F',
  tintSuave: 'rgba(255,90,79,0.16)',
  sobreTint: '#FFFFFF',
  sucesso: '#30D158',
  sucessoCheio: '#1A7F37',
  perigo: '#FF6961',
  perigoCheio: '#C4231B',
  ouro: '#FFD60A',
  controleSelecionado: '#636366',
  overlay: 'rgba(0,0,0,0.6)',
  sombra: '#000000',
};

export type NomeCor = keyof PaletaCores;

// Anel de foco de teclado (web) — um valor só, que passa 3:1 nos dois temas (5,4 no branco, 3,9 no
// preto). Fica fora da paleta porque o estilo do anel é estático (hooks/useFocoVisivel.ts).
export const CorFoco = '#CC2A1F';

// Cores de faixa/graduação — dado de domínio, não paleta de UI. Só o SeloFaixa usa.
export const CoresFaixa = {
  branca: '#ECEAE4',
  cinza: '#8E8E93',
  amarela: '#E8C02E',
  laranja: '#E5822D',
  verde: '#2E9D4F',
  azul: '#2F6FD6',
  roxa: '#7D4CC9',
  marrom: '#7A4B2A',
  vermelha: '#C8231D',
  preta: '#000000',
  neutra: '#3A3A3F', // fallback quando o texto livre não é reconhecido
} as const;

// Fonte do sistema em todo o app (SF Pro no iOS, Roboto no Android, pilha do sistema no web).
// A Homebase é só da marca: wordmark e splash.
export const FamiliaFonte = {
  marca: 'Homebase',
} as const;

// Escala de tipos do iOS (pt): tamanho / altura de linha / peso
export const Tipografia = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const;

// Grade de 4pt.
export const Espacamento = {
  minimo: 4,
  pequeno: 8,
  medio: 12,
  padrao: 16,
  grande: 24,
  extraGrande: 32,
  enorme: 48,
} as const;

// Cantos contínuos (borderCurve: 'continuous' junto com estes raios).
export const Raios = {
  campo: 10, // campos de texto, controles pequenos
  lista: 12, // grupos de lista inseridos, cartões comuns
  destaque: 16, // cartões de destaque, sheets, botões grandes
  capsula: 999, // botões, chips
} as const;

// Largura máxima de conteúdo em web/tablet — container centralizado, sem 2 colunas.
export const LarguraMaxima = {
  formulario: 480,
  lista: 720,
} as const;

// Alturas de toque/controle (pt).
export const Alturas = {
  alvoMinimo: 44,
  linha: 44, // linha de lista agrupada
  botao: 50,
  botaoCompacto: 34,
  campo: 44,
} as const;

export const DuracaoAnimacao = {
  rapida: 150,
  base: 250,
  lenta: 350,
  contador: 600,
} as const;

// Mola curta e discreta (Animated.spring) — sem overshoot exagerado
export const Mola = {
  damping: 18,
  stiffness: 220,
  mass: 1,
} as const;
