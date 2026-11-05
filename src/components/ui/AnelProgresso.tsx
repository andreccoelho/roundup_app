// AnelProgresso — XP até o próximo nível (RF17) como anel de progresso no estilo dos anéis de
// Atividade do iOS: traço grosso com ponta arredondada no tint sobre a trilha do próprio tint em
// baixa opacidade, nível no centro e o XP ao lado. Escolhido no lugar da barra para o dado
// principal do perfil e da Home: é a forma que o app Fitness consagrou para "quanto falta" e deixa
// o nível em destaque no centro. A barra contínua (BarraProgresso) fica para listas, como missões.
// O anel preenche e o XP conta ao montar (reduce motion: valor final direto).
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { criarEstilos, DuracaoAnimacao, Espacamento, useTema } from '../../theme';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { useNumeroAnimado } from '../../hooks/useNumeroAnimado';
import Texto from './Texto';

interface AnelProgressoProps {
  nivel: number;
  xpAtual: number;
  xpProximoNivel: number;
  tamanho?: number;
  // Só o anel com o nível dentro, sem o texto de XP ao lado
  compacto?: boolean;
}

export default function AnelProgresso({ nivel, xpAtual, xpProximoNivel, tamanho = 112, compacto }: AnelProgressoProps) {
  const reduzido = useMovimentoReduzido();
  const { cores } = useTema();
  const styles = useEstilos();
  const maximo = xpProximoNivel <= 1 && xpAtual >= xpProximoNivel;
  const progresso = maximo ? 1 : xpProximoNivel > 0 ? Math.min(1, xpAtual / xpProximoNivel) : 0;
  const animado = useRef(new Animated.Value(reduzido ? progresso : 0)).current;
  // O valor animado chega ao SVG por listener (e não por createAnimatedComponent, que no web
  // repassa props internas do Animated ao DOM): funciona igual nas três plataformas.
  const [fracao, setFracao] = useState(reduzido ? progresso : 0);
  const xpExibido = useNumeroAnimado(xpAtual);

  useEffect(() => {
    const id = animado.addListener(({ value }) => setFracao(value));
    return () => animado.removeListener(id);
  }, [animado]);

  useEffect(() => {
    if (reduzido) {
      animado.setValue(progresso);
      setFracao(progresso);
      return;
    }
    Animated.timing(animado, {
      toValue: progresso,
      duration: DuracaoAnimacao.contador * 1.4,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progresso, reduzido, animado]);

  const espessura = Math.round(tamanho * 0.12);
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const faltam = Math.max(0, xpProximoNivel - xpAtual);

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={maximo ? `Nível ${nivel}, nível máximo` : `Nível ${nivel}: ${xpAtual} de ${xpProximoNivel} XP`}
      accessibilityValue={{ min: 0, max: xpProximoNivel, now: xpAtual }}
    >
      <View style={{ width: tamanho, height: tamanho }}>
        <Svg width={tamanho} height={tamanho} aria-hidden>
          <Circle cx={tamanho / 2} cy={tamanho / 2} r={raio} stroke={cores.tint} strokeOpacity={0.18} strokeWidth={espessura} fill="none" />
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke={cores.tint}
            strokeWidth={espessura}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circunferencia} ${circunferencia}`}
            strokeDashoffset={circunferencia * (1 - fracao)}
            // Começa às 12h, como os anéis de Atividade
            transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
          />
        </Svg>
        <View style={styles.centro} aria-hidden>
          <Texto variante="caption">Nível</Texto>
          <Texto variante={tamanho >= 96 ? 'numeroGrande' : 'numero'}>{nivel}</Texto>
        </View>
      </View>
      {compacto ? null : (
        <View style={styles.textos}>
          {maximo ? (
            <Texto variante="headline">Nível máximo</Texto>
          ) : (
            <>
              <View style={styles.xp}>
                <Texto variante="numero">{xpExibido}</Texto>
                <Texto variante="subheadline">{`de ${xpProximoNivel} XP`}</Texto>
              </View>
              <Texto variante="footnote">{`Faltam ${faltam} XP para o nível ${nivel + 1}`}</Texto>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  container: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.padrao + 4 },
  centro: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
  xp: { flexDirection: 'row', alignItems: 'baseline', gap: Espacamento.minimo + 2 },
}));
