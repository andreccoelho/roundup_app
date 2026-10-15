// BotaoCheckIn — versão compacta dos 3 estados de check-in (RN08) para linhas de lista
// (CartaoSessao na Agenda e em "próximos treinos"). O CTA cheio em acento fica com o HeroCheckIn;
// aqui o "disponível" é contornado, para várias linhas não gastarem o acento da tela.
//  - disponível: botão contornado com luva;
//  - fora da janela: cadeado + motivo curto em texto2 (estado, não erro — sem vermelho);
//  - feito: ✓ verde "Feito", com punch + flash + haptic na transição (reduce motion respeitado).
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Alturas, Cores, DuracaoAnimacao, Espacamento, Raios } from '../../theme';
import type { EstadoCheckIn } from '../../utils/statusCheckIn';
import { hapticaImpacto, hapticaSucesso } from '../../utils/haptica';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import { IconeCadeado, IconeCheck, IconeLuva } from '../icones';
import Texto from './Texto';

interface BotaoCheckInProps {
  estado: EstadoCheckIn;
  motivo?: string;
  carregando?: boolean;
  onPress?: () => void;
}

export default function BotaoCheckIn({ estado, motivo, carregando, onPress }: BotaoCheckInProps) {
  const reduzido = useMovimentoReduzido();
  const foco = useFocoVisivel();
  const estadoAnterior = useRef(estado);
  const escala = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (estadoAnterior.current !== 'realizado' && estado === 'realizado') {
      hapticaSucesso();
      if (!reduzido) {
        escala.setValue(1);
        flash.setValue(0);
        Animated.parallel([
          Animated.sequence([
            Animated.timing(escala, { toValue: 1.2, duration: DuracaoAnimacao.rapida, useNativeDriver: true }),
            Animated.spring(escala, { toValue: 1, friction: 4, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(flash, { toValue: 0.35, duration: 80, useNativeDriver: true }),
            Animated.timing(flash, { toValue: 0, duration: DuracaoAnimacao.base, useNativeDriver: true }),
          ]),
        ]).start();
      }
    }
    estadoAnterior.current = estado;
  }, [estado, escala, flash, reduzido]);

  if (estado === 'realizado') {
    return (
      <Animated.View style={[styles.selo, { transform: [{ scale: escala }] }]} accessible accessibilityLabel="Check-in feito">
        <Animated.View style={[styles.flash, { opacity: flash }]} />
        <IconeCheck cor={Cores.sucesso} tamanho={18} />
        <Texto variante="rotuloPlacar" cor="sucesso">
          Feito
        </Texto>
      </Animated.View>
    );
  }

  if (estado === 'foraDaJanela') {
    return (
      <View style={styles.selo} accessible accessibilityLabel={motivo ?? 'Check-in indisponível'}>
        <IconeCadeado cor={Cores.texto3} tamanho={16} />
        <Texto variante="legenda" cor="texto2" style={styles.motivo} numberOfLines={2}>
          {motivo ?? 'Fechado'}
        </Texto>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.botao, pressed && styles.pressionado, estiloSemOutline, foco.focado && estiloAnelFoco]}
      onPress={() => {
        hapticaImpacto();
        onPress?.();
      }}
      disabled={carregando}
      accessibilityRole="button"
      accessibilityLabel={carregando ? 'Enviando check-in' : 'Fazer check-in'}
      accessibilityState={{ disabled: Boolean(carregando), busy: Boolean(carregando) }}
      {...foco.propsFoco}
    >
      {carregando ? (
        <ActivityIndicator color={Cores.texto} size="small" />
      ) : (
        <>
          <IconeLuva cor={Cores.texto} tamanho={18} />
          <Texto variante="rotuloPlacar" cor="texto">
            Check-in
          </Texto>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.minimo + 2,
    borderWidth: 1.5,
    borderColor: Cores.texto,
    borderRadius: Raios.vivo,
    paddingHorizontal: Espacamento.medio,
    minHeight: Alturas.alvoMinimo,
    minWidth: 112,
  },
  pressionado: { backgroundColor: Cores.superficie2 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.minimo + 2,
    minHeight: Alturas.alvoMinimo,
    paddingHorizontal: Espacamento.pequeno,
    borderRadius: Raios.vivo,
    overflow: 'hidden',
  },
  motivo: { maxWidth: 140, textAlign: 'right' },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Cores.sucesso },
});
