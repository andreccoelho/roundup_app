// Cartão — usar só quando agrupa informação que pertence junto, nunca como invólucro padrão
// de toda tela (ver DESIGN_BRIEF.md, "kit de card de SaaS"). `raio` é prop, não constante, para
// que tipos de conteúdo diferentes possam ter tratamentos diferentes.
import { StyleSheet, View, ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Cores, Espacamento, Geometria, Raios } from '../../theme';

interface CartaoProps extends ViewProps {
  raio?: number;
  semBorda?: boolean;
  // script.md, item 1: "trocar cards retangulares uniformes por... corte diagonal... como se
  // fossem placas de ringue" — opt-in (nenhum uso existente do Cartão quebra) e sem borda nesse
  // modo: o preenchimento SVG já resolve sozinho a separação visual do fundo da tela.
  corteDiagonal?: boolean;
  corFundo?: string;
}

export default function Cartao({
  style,
  raio = Raios.pequeno,
  semBorda,
  corteDiagonal,
  corFundo = Cores.texto,
  children,
  ...resto
}: CartaoProps) {
  if (corteDiagonal) {
    const corte = Geometria.corteDiagonal;
    return (
      <View style={[styles.wrapperCorte, style]} {...resto}>
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
          <Path d={`M0,0 H100 V${100 - corte} L${100 - corte},100 H0 Z`} fill={corFundo} />
        </Svg>
        <View style={styles.conteudoCorte}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.cartao, { borderRadius: raio }, semBorda && styles.semBorda, style]} {...resto}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderWidth: 1,
    borderColor: Cores.linha,
    padding: Espacamento.padrao,
  },
  semBorda: { borderWidth: 0 },
  wrapperCorte: { position: 'relative', overflow: 'hidden' },
  conteudoCorte: { padding: Espacamento.padrao },
});
