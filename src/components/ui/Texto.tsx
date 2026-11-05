// Texto — única porta de entrada tipográfica (docs/DESIGN.md). Nenhuma tela recompõe
// fontSize/fontFamily/fontWeight na mão: escolhe uma variante e, se precisar, a cor.
//
// Escala de tipos do iOS na fonte do sistema (Large Title a Caption). Números — XP, nível,
// posição, contadores, horário — usam as variantes `numero*`: fonte do sistema em peso forte com
// algarismos tabulares, como os totais do app Fitness. `marca` (Homebase) é só para o wordmark.
// Dynamic Type: a fonte acompanha o tamanho do sistema; só os números grandes e o Large Title têm
// teto (maxFontSizeMultiplier), onde o layout quebraria. Títulos entram na árvore de
// acessibilidade como "header" por padrão.
import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { FamiliaFonte, Tipografia, useTema, type NomeCor } from '../../theme';

export type VarianteTexto =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption'
  | 'numero'
  | 'numeroGrande'
  | 'numeroXL'
  | 'marca';

const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

const ESTILOS = StyleSheet.create<Record<VarianteTexto, TextStyle>>({
  ...Tipografia,
  numero: { fontSize: 22, lineHeight: 28, fontWeight: '700', ...TABULAR },
  numeroGrande: { fontSize: 34, lineHeight: 41, fontWeight: '800', ...TABULAR },
  numeroXL: { fontSize: 64, lineHeight: 72, fontWeight: '800', ...TABULAR },
  // Homebase só existe em caixa alta; letterSpacing abre o desenho condensado.
  marca: { fontFamily: FamiliaFonte.marca, fontSize: 32, lineHeight: 36, letterSpacing: 1 },
});

const COR_PADRAO: Record<VarianteTexto, NomeCor> = {
  largeTitle: 'texto',
  title1: 'texto',
  title2: 'texto',
  title3: 'texto',
  headline: 'texto',
  body: 'texto',
  callout: 'texto',
  subheadline: 'texto2',
  footnote: 'texto2',
  caption: 'texto2',
  numero: 'texto',
  numeroGrande: 'texto',
  numeroXL: 'texto',
  marca: 'texto',
};

const VARIANTES_CABECALHO: VarianteTexto[] = ['largeTitle', 'title1', 'title2', 'title3', 'marca'];

const TETO_ESCALA: Partial<Record<VarianteTexto, number>> = {
  largeTitle: 1.6,
  numero: 1.6,
  numeroGrande: 1.4,
  numeroXL: 1.2,
  marca: 1.3,
};

interface TextoProps extends TextProps {
  variante?: VarianteTexto;
  cor?: NomeCor;
  alinhamento?: TextStyle['textAlign'];
  // Força ligar/desligar o role "header" (padrão: ligado nos títulos).
  cabecalho?: boolean;
  children?: ReactNode;
}

export default function Texto({
  variante = 'body',
  cor,
  alinhamento,
  cabecalho,
  style,
  accessibilityRole,
  children,
  ...resto
}: TextoProps) {
  const { cores } = useTema();
  const ehCabecalho = cabecalho ?? VARIANTES_CABECALHO.includes(variante);
  return (
    <Text
      style={[ESTILOS[variante], { color: cores[cor ?? COR_PADRAO[variante]] }, alinhamento ? { textAlign: alinhamento } : null, style]}
      accessibilityRole={accessibilityRole ?? (ehCabecalho ? 'header' : undefined)}
      maxFontSizeMultiplier={TETO_ESCALA[variante]}
      {...resto}
    >
      {children}
    </Text>
  );
}

export const estilosTexto = ESTILOS;
