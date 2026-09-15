// Esqueleto de carregamento (shimmer) — no lugar de spinner centralizado; "carregando" é um
// dos 4 estados obrigatórios de toda tela (ver SCRIPT.md, Passo 4). Respeita
// AccessibilityInfo.isReduceMotionEnabled: sem animação, fica num bloco estático.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { Cores, Espacamento, Raios } from '../../theme';

interface EsqueletoProps {
  altura?: number;
  largura?: number | `${number}%`;
  raio?: number;
  repeticoes?: number;
}

export default function Esqueleto({ altura = 16, largura = '100%', raio = Raios.pequeno, repeticoes = 1 }: EsqueletoProps) {
  const opacidade = useRef(new Animated.Value(0.4)).current;
  const [movimentoReduzido, setMovimentoReduzido] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setMovimentoReduzido)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (movimentoReduzido) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacidade, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [movimentoReduzido, opacidade]);

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: repeticoes }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bloco,
            { height: altura, width: largura, borderRadius: raio, opacity: movimentoReduzido ? 0.6 : opacidade },
            i > 0 && styles.espacoEntreBlocos,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { backgroundColor: Cores.cinzaBorda },
  espacoEntreBlocos: { marginTop: Espacamento.pequeno },
});
