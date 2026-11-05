// BotaoCheckIn — versão compacta dos 3 estados de check-in (RN08) para linhas de lista (CartaoSessao
// na Agenda e em "próximos treinos"). O botão cheio no tint fica com o HeroCheckIn; aqui o
// "disponível" é o botão cinza compacto, para várias linhas não competirem com a ação da tela.
//  - disponível: botão cinza em cápsula "Check-in" (rótulo no tint);
//  - fora da janela: cadeado + motivo curto em texto2 (estado, não erro — sem vermelho);
//  - feito: ✓ verde preenchido "Feito", que entra com mola + haptic de sucesso (reduce motion
//    respeitado).
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Alturas, criarEstilos, Espacamento, Mola, useTema } from '../../theme';
import { DRIVER_NATIVO } from '../../utils/animacao';
import type { EstadoCheckIn } from '../../utils/statusCheckIn';
import { hapticaImpacto, hapticaSucesso } from '../../utils/haptica';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { IconeCadeado, IconeCheckCirculo } from '../icones';
import Botao from './Botao';
import Texto from './Texto';

interface BotaoCheckInProps {
  estado: EstadoCheckIn;
  motivo?: string;
  carregando?: boolean;
  onPress?: () => void;
}

export default function BotaoCheckIn({ estado, motivo, carregando, onPress }: BotaoCheckInProps) {
  const reduzido = useMovimentoReduzido();
  const { cores } = useTema();
  const styles = useEstilos();
  const estadoAnterior = useRef(estado);
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (estadoAnterior.current !== 'realizado' && estado === 'realizado') {
      hapticaSucesso();
      if (!reduzido) {
        escala.setValue(0.4);
        Animated.spring(escala, { toValue: 1, ...Mola, useNativeDriver: DRIVER_NATIVO }).start();
      }
    }
    estadoAnterior.current = estado;
  }, [estado, escala, reduzido]);

  if (estado === 'realizado') {
    return (
      <View style={styles.selo} accessible accessibilityLabel="Check-in feito">
        <Animated.View style={{ transform: [{ scale: escala }] }}>
          <IconeCheckCirculo cor={cores.sucesso} tamanho={22} preenchido />
        </Animated.View>
        <Texto variante="subheadline" cor="sucesso">
          Feito
        </Texto>
      </View>
    );
  }

  if (estado === 'foraDaJanela') {
    return (
      <View style={styles.selo} accessible accessibilityLabel={motivo ?? 'Check-in indisponível'}>
        <IconeCadeado cor={cores.texto3} tamanho={15} />
        <Texto variante="footnote" style={styles.motivo} numberOfLines={2}>
          {motivo ?? 'Fechado'}
        </Texto>
      </View>
    );
  }

  return (
    <Botao
      titulo="Check-in"
      variante="secundario"
      compacto
      carregando={carregando}
      accessibilityLabel={carregando ? 'Enviando check-in' : 'Fazer check-in'}
      onPress={() => {
        hapticaImpacto();
        onPress?.();
      }}
    />
  );
}

const useEstilos = criarEstilos(() => ({
  selo: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.minimo + 2, minHeight: Alturas.alvoMinimo },
  motivo: { maxWidth: 140, textAlign: 'right' },
}));
