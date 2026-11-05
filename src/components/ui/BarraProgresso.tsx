// BarraProgresso — XP até o próximo nível (RF17) como barra contínua arredondada (estilo iOS), para
// onde o anel (AnelProgresso) não cabe. Preenchimento no tint sobre a trilha `preenchimento`
// (4,6:1 entre os dois no claro). Preenchimento e contador animados ao montar (reduce motion:
// valor final direto).
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { criarEstilos, DuracaoAnimacao, Espacamento } from '../../theme';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { useNumeroAnimado } from '../../hooks/useNumeroAnimado';
import Texto from './Texto';

interface BarraProgressoProps {
  nivel: number;
  xpAtual: number;
  xpProximoNivel: number;
}

export default function BarraProgresso({ nivel, xpAtual, xpProximoNivel }: BarraProgressoProps) {
  const reduzido = useMovimentoReduzido();
  const styles = useEstilos();
  const maximo = xpProximoNivel <= 1 && xpAtual >= xpProximoNivel;
  const progresso = maximo ? 1 : xpProximoNivel > 0 ? Math.min(1, xpAtual / xpProximoNivel) : 0;
  const preenchimento = useRef(new Animated.Value(reduzido ? progresso : 0)).current;
  const xpExibido = useNumeroAnimado(xpAtual);

  useEffect(() => {
    if (reduzido) {
      preenchimento.setValue(progresso);
      return;
    }
    Animated.timing(preenchimento, { toValue: progresso, duration: DuracaoAnimacao.contador, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progresso, reduzido, preenchimento]);

  const faltam = Math.max(0, xpProximoNivel - xpAtual);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={maximo ? `Nível ${nivel}, nível máximo` : `Nível ${nivel}: ${xpAtual} de ${xpProximoNivel} XP`}
      accessibilityValue={{ min: 0, max: xpProximoNivel, now: xpAtual }}
    >
      <View style={styles.cabecalho}>
        <Texto variante="headline">{`Nível ${nivel}`}</Texto>
        {maximo ? (
          <Texto variante="subheadline">Nível máximo</Texto>
        ) : (
          <Texto variante="subheadline" style={styles.tabular}>{`${xpExibido} / ${xpProximoNivel} XP`}</Texto>
        )}
      </View>
      <View style={styles.trilha}>
        <Animated.View style={[styles.cheio, { width: preenchimento.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      {!maximo ? (
        <Texto variante="footnote" style={styles.falta}>
          {`Faltam ${faltam} XP para o nível ${nivel + 1}`}
        </Texto>
      ) : null}
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Espacamento.pequeno },
  tabular: { fontVariant: ['tabular-nums'] },
  trilha: { height: 8, borderRadius: 4, backgroundColor: c.preenchimento, overflow: 'hidden' },
  cheio: { height: 8, borderRadius: 4, backgroundColor: c.tint },
  falta: { marginTop: Espacamento.pequeno },
}));
