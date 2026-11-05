// Esqueleto de carregamento — blocos em `preenchimento` com pulso suave de opacidade (como os
// placeholders do iOS). Com reduce motion fica parado. `forma="linha"` imita uma linha de lista (avatar/ícone + 2 linhas de texto), mais fiel
// ao conteúdo real que blocos genéricos.
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { criarEstilos, Espacamento } from '../../theme';
import { DRIVER_NATIVO } from '../../utils/animacao';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';

interface EsqueletoProps {
  altura?: number;
  largura?: number | `${number}%`;
  raio?: number;
  repeticoes?: number;
  forma?: 'bloco' | 'linha';
}

export default function Esqueleto({ altura = 16, largura = '100%', raio = 8, repeticoes = 1, forma = 'bloco' }: EsqueletoProps) {
  const styles = useEstilos();
  const reduzido = useMovimentoReduzido();
  const opacidade = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (reduzido) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 1, duration: 650, useNativeDriver: DRIVER_NATIVO }),
        Animated.timing(opacidade, { toValue: 0.5, duration: 650, useNativeDriver: DRIVER_NATIVO }),
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

const useEstilos = criarEstilos((c) => ({
  bloco: { backgroundColor: c.preenchimento, borderRadius: 6 },
  espacoEntreBlocos: { marginTop: Espacamento.pequeno },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, paddingVertical: Espacamento.medio },
  separada: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.separador },
  marcador: { width: 40, height: 40, borderRadius: 20 },
  textos: { flex: 1, gap: Espacamento.pequeno },
}));
