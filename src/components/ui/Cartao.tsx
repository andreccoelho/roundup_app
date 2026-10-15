// Cartão — superfície elevada (superficie1, canto vivo, sem borda). Só para blocos que de fato
// agrupam conteúdo (hero, card de faixa, item de missão); listas usam linhas sobre o fundo, nunca
// uma pilha de cartões (docs/DESIGN.md).
//
// `corteDiagonal`: canto inferior direito cortado (placa de ringue) — no máximo uma vez por tela.
// O corte tem tamanho fixo em px (Geometria.corteDiagonal, limitado a 40% da altura), medido com
// onLayout: em % do lado ele ficava raso demais em cards largos e quase sumia.
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Cores, Espacamento, Geometria, Raios } from '../../theme';

interface CartaoProps extends ViewProps {
  corteDiagonal?: boolean;
  corFundo?: string;
  // Filete superior de 2px (ex.: estado do hero de check-in).
  corFilete?: string;
  semPadding?: boolean;
}

export default function Cartao({ style, corteDiagonal, corFundo = Cores.superficie1, corFilete, semPadding, children, onLayout, ...resto }: CartaoProps) {
  const [tamanho, setTamanho] = useState<{ w: number; h: number } | null>(null);

  if (corteDiagonal) {
    function medir(e: LayoutChangeEvent) {
      const { width, height } = e.nativeEvent.layout;
      setTamanho({ w: width, h: height });
      onLayout?.(e);
    }
    const corte = tamanho ? Math.min(Geometria.corteDiagonal, tamanho.h * 0.4) : 0;
    return (
      <View style={[styles.wrapperCorte, style]} onLayout={medir} {...resto}>
        {tamanho ? (
          <Svg style={StyleSheet.absoluteFill} width={tamanho.w} height={tamanho.h} aria-hidden>
            <Path
              d={`M0,0 H${tamanho.w} V${tamanho.h - corte} L${tamanho.w - corte},${tamanho.h} H0 Z`}
              fill={corFundo}
            />
          </Svg>
        ) : null}
        {corFilete ? <View style={[styles.filete, { backgroundColor: corFilete }]} /> : null}
        <View style={!semPadding && styles.conteudo}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[styles.cartao, { backgroundColor: corFundo }, !semPadding && styles.conteudo, style]}
      onLayout={onLayout}
      {...resto}
    >
      {corFilete ? <View style={[styles.filete, { backgroundColor: corFilete }]} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { borderRadius: Raios.pequeno, overflow: 'hidden' },
  wrapperCorte: { position: 'relative', overflow: 'hidden', borderTopLeftRadius: Raios.pequeno, borderTopRightRadius: Raios.pequeno },
  filete: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  conteudo: { padding: Espacamento.padrao },
});
