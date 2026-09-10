// Dois registros tipográficos, ver DESIGN_BRIEF.md:
// - placar: grotesco condensado (Oswald) para números e headlines de placar (XP, %, contagens)
// - corpo: sans neutro do sistema (Homebase Regular entra aqui quando o asset existir)
export const FontFamily = {
  regular: undefined as string | undefined,
  // homebaseRegular: 'HomebaseRegular', // descomentar após adicionar o arquivo de fonte

  placarRegular: 'Oswald_400Regular',
  placarSemiBold: 'Oswald_600SemiBold',
  placarBold: 'Oswald_700Bold',
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  placar: 48,     // números grandes de placar (XP, sequência)
  placarLg: 64,   // hero de faixa/graduação
} as const;
