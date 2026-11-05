// BarraProgresso — XP até o próximo nível (RF17). Segmentada "por round" (10 segmentos).
// Trilha visível: segmento vazio é um traço em `linhaForte` (3,9:1 sobre o fundo, ≥3:1 de
// componente de UI); segmento cheio é um bloco em acento — diferença de forma, não só de cor.
// Preenchimento e contador de XP animados ao montar (reduce motion: valor final direto).
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Cores, DuracaoAnimacao, Espacamento } from '../../theme';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { useNumeroAnimado } from '../../hooks/useNumeroAnimado';
import Texto from './Texto';

interface BarraProgressoProps {
  nivel: number;
  xpAtual: number;
  xpProximoNivel: number;
}

const SEGMENTOS = 10;

function Segmentos({ cheio, largura }: { cheio: boolean; largura?: number }) {
  return (
    <View style={[styles.segmentos, largura ? { width: largura } : null]}>
      {Array.from({ length: SEGMENTOS }).map((_, i) => (
        <View key={i} style={styles.segmento}>
          <View style={cheio ? styles.cheio : styles.vazio} />
        </View>
      ))}
    </View>
  );
}

export default function BarraProgresso({ nivel, xpAtual, xpProximoNivel }: BarraProgressoProps) {
  const reduzido = useMovimentoReduzido();
  const maximo = xpProximoNivel <= 1 && xpAtual >= xpProximoNivel;
  const progresso = xpProximoNivel > 0 ? Math.min(1, xpAtual / xpProximoNivel) : 0;
  const [largura, setLargura] = useState(0);
  const preenchimento = useRef(new Animated.Value(reduzido ? progresso : 0)).current;
  const xpExibido = useNumeroAnimado(xpAtual);

  useEffect(() => {
    if (reduzido) {
      preenchimento.setValue(progresso);
      return;
    }
    Animated.timing(preenchimento, {
      toValue: progresso,
      duration: DuracaoAnimacao.contador,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progresso, reduzido, preenchimento]);

  const faltam = Math.max(0, xpProximoNivel - xpAtual);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={maximo ? `Nível ${nivel}, nível máximo` : `Nível ${nivel}: ${xpAtual} de ${xpProximoNivel} XP`}
      accessibilityValue={{ min: 0, max: xpProximoNivel, now: xpAtual }}
    >
      <View style={styles.cabecalho}>
        <View style={styles.nivel}>
          <Texto variante="caption">Nível</Texto>
          <Texto variante="numero">{nivel}</Texto>
        </View>
        {maximo ? (
          <Texto variante="caption" cor="texto">
            Nível máximo
          </Texto>
        ) : (
          <View style={styles.xp}>
            <Texto variante="numero">{xpExibido}</Texto>
            <Texto variante="caption" cor="texto3">{`/ ${xpProximoNivel} XP`}</Texto>
          </View>
        )}
      </View>
      <View style={styles.trilha} onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}>
        <Segmentos cheio={false} />
        <Animated.View
          style={[
            styles.camadaCheia,
            { width: preenchimento.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        >
          {largura > 0 ? <Segmentos cheio largura={largura} /> : null}
        </Animated.View>
      </View>
      {!maximo ? (
        <Texto variante="subheadline" cor="texto3" style={styles.falta}>
          {`Faltam ${faltam} XP para o nível ${nivel + 1}`}
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Espacamento.pequeno },
  nivel: { flexDirection: 'row', alignItems: 'baseline', gap: Espacamento.pequeno },
  xp: { flexDirection: 'row', alignItems: 'baseline', gap: Espacamento.minimo },
  trilha: { height: 10, justifyContent: 'center' },
  segmentos: { flexDirection: 'row', gap: 3, height: 10 },
  segmento: { flex: 1, justifyContent: 'center' },
  vazio: { height: 2, backgroundColor: Cores.linhaForte },
  cheio: { height: 10, backgroundColor: Cores.acento },
  camadaCheia: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  falta: { marginTop: Espacamento.pequeno },
});
