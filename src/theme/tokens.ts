// Tokens visuais do RoundUp — direção "Noite de luta" (docs/DESIGN.md). Fonte única: nenhuma
// tela define cor, tamanho de fonte ou raio fora daqui. Tema só escuro.
//
// Contraste (WCAG 2.1) medido sobre `fundo` / `superficie1` / `superficie2`:
//   texto 17,6 / 16,2 / 14,2 · texto2 8,1 / 7,4 / 6,5 · texto3 5,6 / 5,1 / 4,5
//   acento 5,0 / 4,6 / 4,0 · sucesso 7,3 / 6,7 / 5,9 · perigo 4,5 / 4,2 / 3,7 · ouro 8,8 / 8,1 / 7,1
//   linhaForte 3,9 / 3,6 / 3,1 (limite de componente de UI, >= 3:1)
// Por isso: texto em `perigo` só sobre `fundo`; `texto3` nunca sobre `superficie2`; texto em
// `acento` nunca sobre `superficie2`. Texto sobre botão de acento/sucesso/perigo é sempre
// `sobreCor` (#0B0B0C: 5,0 / 7,3 / 4,5).

export const Cores = {
  fundo: '#0B0B0C', // lona noturna — fundo de toda tela
  superficie1: '#161618', // cards, inputs, linha destacada
  superficie2: '#222225', // folha, diálogo, estado pressionado
  linha: '#2C2C30', // separadores decorativos (não precisa 3:1)
  linhaForte: '#6E6E74', // borda de input e contornos de UI (>= 3:1)

  texto: '#F4F2EE', // branco-osso — texto principal
  texto2: '#A8A6A1', // secundário
  texto3: '#8A8884', // terciário, placeholder

  acento: '#F03A2E', // corner vermelho — CTA principal + no máximo 1 destaque por tela
  sucesso: '#2FB457', // check-in feito, presença
  perigo: '#E5322D', // erro, ação destrutiva
  ouro: '#D4A72C', // só 1º lugar do ranking e medalha de nível máximo

  sobreCor: '#0B0B0C', // texto/ícone sobre acento, sucesso, perigo ou ouro
  overlay: 'rgba(0,0,0,0.72)', // fundo de diálogo, folha e momento de conquista
  foco: '#F03A2E', // anel/realce de foco = acento
} as const;

export type NomeCor = keyof typeof Cores;

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

// Os nomes abaixo precisam bater com as chaves registradas em useFonts (App.tsx).
export const FamiliaFonte = {
  corpo: undefined as string | undefined, // sans do sistema — corpo de texto
  placarRegular: 'Oswald_400Regular',
  placarSemiBold: 'Oswald_600SemiBold',
  placarBold: 'Oswald_700Bold',
  display: 'Homebase', // fonte de marca, só caixa alta — títulos display e wordmark
} as const;

export const TamanhoFonte = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 40,
  placar: 48,
  placarXL: 96,
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

// Cantos vivos (docs/DESIGN.md): 2-4 em botões, inputs e cards; pílula só em chips.
export const Raios = {
  nenhum: 0,
  vivo: 2,
  pequeno: 4,
  pilula: 999,
} as const;

// Largura máxima de conteúdo em web/tablet — container centralizado, sem 2 colunas.
export const LarguraMaxima = {
  formulario: 480,
  lista: 720,
} as const;

// Alturas de toque/controle.
export const Alturas = {
  alvoMinimo: 44,
  botao: 48,
  botaoHero: 56,
  abaBarra: 56, // + insets.bottom
} as const;

export const DuracaoAnimacao = {
  rapida: 150,
  base: 200,
  lenta: 320,
  dramatica: 500,
  contador: 600,
} as const;

// Sombra dura só em título display de hero/conquista, na cor do acento, offset 2/2.
export const Sombras = {
  duraAcento: {
    textShadowColor: Cores.acento,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
} as const;

// Corte diagonal (% do lado, num viewBox 0-100 esticado). No máximo uma vez por tela: hero de
// check-in e card de faixa.
export const Geometria = {
  corteDiagonal: 14,
} as const;
