// Texto — única porta de entrada tipográfica (docs/DESIGN.md). Nenhuma tela recompõe
// fontSize/fontFamily/fontWeight na mão: escolhe uma variante e, se precisar, a cor.
//
// Três registros: display (Homebase, só caixa alta), placar (Oswald, números tabulares) e corpo
// (sans do sistema). Títulos (display/titulo/secao) entram na árvore de acessibilidade como
// "header" por padrão — navegação por cabeçalhos no leitor de tela.
import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { Cores, FamiliaFonte, TamanhoFonte, type NomeCor } from '../../theme';

export type VarianteTexto =
  | 'display'
  | 'titulo'
  | 'secao'
  | 'corpo'
  | 'corpoForte'
  | 'legenda'
  | 'rotuloPlacar'
  | 'placar'
  | 'placarGrande'
  | 'placarXL';

const ESTILOS: Record<VarianteTexto, TextStyle> = {
  // Homebase só existe em caixa alta; letterSpacing abre o desenho condensado.
  display: { fontFamily: FamiliaFonte.display, fontSize: TamanhoFonte.xxl, lineHeight: 36, letterSpacing: 1 },
  titulo: { fontSize: TamanhoFonte.lg, lineHeight: 26, fontWeight: '700' },
  // Cabeçalho de seção: Oswald caixa alta, mesmo idioma do rótulo de placar, um degrau acima.
  secao: {
    fontFamily: FamiliaFonte.placarSemiBold,
    fontSize: TamanhoFonte.sm,
    lineHeight: 18,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  corpo: { fontSize: TamanhoFonte.md, lineHeight: 22 },
  corpoForte: { fontSize: TamanhoFonte.md, lineHeight: 22, fontWeight: '600' },
  legenda: { fontSize: TamanhoFonte.sm, lineHeight: 20 },
  rotuloPlacar: {
    fontFamily: FamiliaFonte.placarSemiBold,
    fontSize: TamanhoFonte.xs,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  placar: { fontFamily: FamiliaFonte.placarBold, fontSize: TamanhoFonte.xl, lineHeight: 28, fontVariant: ['tabular-nums'] },
  placarGrande: {
    fontFamily: FamiliaFonte.placarBold,
    fontSize: TamanhoFonte.placar,
    lineHeight: 52,
    fontVariant: ['tabular-nums'],
  },
  placarXL: {
    fontFamily: FamiliaFonte.placarBold,
    fontSize: TamanhoFonte.placarXL,
    lineHeight: 100,
    fontVariant: ['tabular-nums'],
  },
};

const COR_PADRAO: Record<VarianteTexto, NomeCor> = {
  display: 'texto',
  titulo: 'texto',
  secao: 'texto2',
  corpo: 'texto',
  corpoForte: 'texto',
  legenda: 'texto2',
  rotuloPlacar: 'texto2',
  placar: 'texto',
  placarGrande: 'texto',
  placarXL: 'texto',
};

const VARIANTES_CABECALHO: VarianteTexto[] = ['display', 'titulo', 'secao'];

interface TextoProps extends TextProps {
  variante?: VarianteTexto;
  cor?: NomeCor;
  alinhamento?: TextStyle['textAlign'];
  // Força ligar/desligar o role "header" (padrão: ligado em display/titulo/secao).
  cabecalho?: boolean;
  children?: ReactNode;
}

export default function Texto({
  variante = 'corpo',
  cor,
  alinhamento,
  cabecalho,
  style,
  accessibilityRole,
  children,
  ...resto
}: TextoProps) {
  const ehCabecalho = cabecalho ?? VARIANTES_CABECALHO.includes(variante);
  return (
    <Text
      style={[ESTILOS[variante], { color: Cores[cor ?? COR_PADRAO[variante]] }, alinhamento ? { textAlign: alinhamento } : null, style]}
      accessibilityRole={accessibilityRole ?? (ehCabecalho ? 'header' : undefined)}
      maxFontSizeMultiplier={variante.startsWith('placar') || variante === 'display' ? 1.3 : undefined}
      {...resto}
    >
      {children}
    </Text>
  );
}

export const estilosTexto = StyleSheet.create(ESTILOS);
