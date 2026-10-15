// Esqueleto de carregamento — pulso de superficie1 para superficie2. Com reduce motion fica
// parado. `forma="linha"` imita uma linha de lista (avatar/ícone + 2 linhas de texto), mais fiel
// ao conteúdo real que blocos genéricos.
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Cores, Espacamento, Raios } from '../../theme';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';

interface EsqueletoProps {
  altura?: number;
  largura?: number | `${number}%`;
  raio?: number;
  repeticoes?: number;
  forma?: 'bloco' | 'linha';
}

export default function Esqueleto({ altura = 16, largura = '100%', raio = Raios.pequeno, repeticoes = 1, forma = 'bloco' }: EsqueletoProps) {
  const reduzido = useMovimentoReduzido();
  const opacidade = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (reduzido) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacidade, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduzido, opacidade]);

  const op = reduzido ? 0.75 : opacidade;

  return (
    <View aria-hidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: repeticoes }).map((_, i) =>
        forma === 'linha' ? (
          <View key={i} style={[styles.linha, i > 0 && styles.separada]}>
            <Animated.View style={[styles.bloco, styles.marcador, { opacity: op }]} />
            <View style={styles.textos}>
              <Animated.View style={[styles.bloco, { height: 14, width: '60%', opacity: op }]} />
              <Animated.View style={[styles.bloco, { height: 12, width: '35%', opacity: op }]} />
            </View>
          </View>
        ) : (
          <Animated.View
            key={i}
            style={[styles.bloco, { height: altura, width: largura, borderRadius: raio, opacity: op }, i > 0 && styles.espacoEntreBlocos]}
          />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { backgroundColor: Cores.superficie2, borderRadius: Raios.vivo },
  espacoEntreBlocos: { marginTop: Espacamento.pequeno },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, paddingVertical: Espacamento.medio },
  separada: { borderTopWidth: 1, borderTopColor: Cores.linha },
  marcador: { width: 40, height: 40, borderRadius: 20 },
  textos: { flex: 1, gap: Espacamento.pequeno },
});
