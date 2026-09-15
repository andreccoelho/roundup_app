// Superfície única e tipada dos tokens visuais do RoundUp. Consolida os valores que hoje
// vivem separados em src/constants/colors.ts e src/constants/typography.ts, mais espaçamento,
// raios e duração de animação — que não tinham nenhum lugar centralizado. Nenhum valor de cor
// ou tipografia foi alterado nesta consolidação: a direção visual em vigor é DESIGN_BRIEF.md.

export const Cores = {
  preto: '#0A0A0A',
  branco: '#FFFFFF',
  cinzaEscuro: '#2A2A2A',   // superfícies escuras elevadas (ex: card de faixa)
  cinzaMedio: '#6B6B6B',    // texto secundário
  // Era #B3B3B3 (2,10:1 sobre branco — abaixo até do mínimo de 3:1 para UI, WCAG 1.4.11).
  // Escurecido para #757575 (4,61:1 sobre branco, passa o limiar de texto de 4,5:1). Efeito
  // colateral aceito: fica visualmente muito perto de cinzaMedio (5,33:1) — não há espaço para
  // um terceiro tom de cinza mais claro que ainda passe 4,5:1 nesta paleta; a hierarquia de 3
  // níveis (escuro/médio/claro) efetivamente colapsa para 2 níveis de texto legível. Ver
  // CHANGELOG_UI.md.
  cinzaClaro: '#757575',    // texto terciário / ícones inativos
  cinzaBorda: '#D9D9D9',    // linhas finas de separação (não bordas de card)
  cinzaFundo: '#F4F4F4',    // fundo de tela — não branco puro, para os cards brancos se destacarem

  checkinValidado: '#2E7D32', // único uso de verde: sucesso de check-in
  alerta: '#B3261E',          // único uso de vermelho: janela de check-in fechada / rejeitado

  // script.md ("identidade de luta"): variante MAIS saturada do verde de sucesso, só para o
  // instante do "impacto" (flash de check-in/missão concluída). checkinValidado continua sendo
  // o verde de uso normal (rótulos, selos "Feito") — não é uma paleta nova, é o mesmo hit tingido
  // mais forte por 1-2 frames, igual instrução do brief.
  impacto: '#1B9E3E',
} as const;

// Os nomes abaixo precisam bater com as chaves registradas em useFonts (App.tsx).
export const FamiliaFonte = {
  regular: undefined as string | undefined, // sans neutra do sistema — corpo de texto, nunca fonte de marca

  placarRegular: 'Oswald_400Regular',
  placarSemiBold: 'Oswald_600SemiBold',
  placarBold: 'Oswald_700Bold',

  // Fonte da marca — só lettering "RNDP"/wordmark e título de tela (ver DESIGN_BRIEF.md).
  // Nunca em número de placar (isso é placarRegular/SemiBold/Bold) nem em corpo de texto.
  homebaseDisplay: 'Homebase',
} as const;

export const TamanhoFonte = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  placar: 48,     // números grandes de placar (XP, sequência)
  placarLg: 64,   // hero de faixa/graduação
} as const;

// Grade de 4pt. Cobre a maioria dos valores de padding/margin/gap já em uso nas telas; os
// poucos fora da grade (ex.: paddingTop: 96 da banda do LoginScreen) são exceções pontuais de
// layout, não fazem parte da escala.
export const Espacamento = {
  minimo: 4,
  pequeno: 8,
  medio: 12,
  padrao: 16,
  grande: 24,
  extraGrande: 32,
  enorme: 48,
} as const;

// Os 4 valores de borderRadius já espalhados pelas telas hoje (chips e pílulas incluídos).
export const Raios = {
  nenhum: 0,
  pequeno: 4,
  medio: 8,
  grande: 16,
  pilula: 20,
} as const;

// script.md: check-in/missão usa `rapida`/`base` (shake+flash de impacto, tem que ser instantâneo
// pra não atrapalhar o fluxo); `dramatica` é só para o momento de subida de faixa/graduação —
// "timing mais dramático (0.4-0.6s), sensação de conquista, não uma modal discreta".
export const DuracaoAnimacao = {
  rapida: 150,
  base: 200,
  lenta: 320,
  dramatica: 500,
} as const;

// script.md, item 2 (tipografia com impacto): sombra dura (sem blur, deslocada) para títulos
// Homebase em telas de destaque — nunca em corpo de texto nem em números de placar (Oswald já
// carrega peso/contraste suficiente sozinho). Mapeia direto em textShadowOffset/textShadowColor/
// textShadowRadius do RN — nenhuma lib nova, é estilo nativo.
export const Sombras = {
  duraTitulo: {
    textShadowColor: Cores.preto,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
} as const;

// script.md, item 1 (linguagem visual de combate): tamanho do corte diagonal usado nos cantos de
// cards/selos de destaque — um valor só, reaproveitado em todo lugar que cortar, pra não virar
// um ângulo diferente por componente. É uma PORCENTAGEM do lado (0-100), não pixels: os
// componentes desenham o corte num viewBox 0-100 de react-native-svg com
// preserveAspectRatio="none" esticado pro tamanho real — proporcional funciona em qualquer
// tamanho de card, sem precisar recalcular pixel por pixel. RN não tem clip-path nativo, por
// isso SVG em vez de CSS puro.
export const Geometria = {
  corteDiagonal: 14,
} as const;
