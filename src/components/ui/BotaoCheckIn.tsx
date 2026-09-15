// BotaoCheckIn — componente de domínio: os 3 estados visuais de check-in (RN08) — disponível,
// fora da janela, já realizado. Antes duplicado em aluno/DashboardScreen.tsx (CardCheckIn) e
// aluno/AgendaScreen.tsx (ItemSessao); consolidado aqui, cada estado com forma, ícone e texto
// próprios (nunca só mudança de cor), conforme DESIGN_BRIEF.md.
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Cores, DuracaoAnimacao, Espacamento, Raios, TamanhoFonte } from '../../theme';
import { EstadoCheckIn } from '../../utils/statusCheckIn';
import { IconeCadeado, IconeCheck, IconeLuva } from '../icones';

interface BotaoCheckInProps {
  estado: EstadoCheckIn;
  motivo?: string;
  carregando?: boolean;
  onPress?: () => void;
}

export default function BotaoCheckIn({ estado, motivo, carregando, onPress }: BotaoCheckInProps) {
  // script.md, item 3: "ao completar um check-in... uma animação curta de 'impacto' (leve
  // shake/punch + flash de cor funcional), não um fade suave genérico". Só dispara na
  // TRANSIÇÃO para "realizado" (não no primeiro render de uma sessão que já chegou feita).
  const estadoAnterior = useRef(estado);
  const escala = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (estadoAnterior.current !== 'realizado' && estado === 'realizado') {
      escala.setValue(1);
      flash.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(escala, { toValue: 1.25, duration: DuracaoAnimacao.rapida, useNativeDriver: true }),
          Animated.spring(escala, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0, duration: DuracaoAnimacao.base, useNativeDriver: true }),
        ]),
      ]).start();
    }
    estadoAnterior.current = estado;
  }, [estado, escala, flash]);

  if (estado === 'realizado') {
    return (
      <Animated.View
        style={[styles.selo, { transform: [{ scale: escala }] }]}
        accessibilityRole="text"
        accessibilityLabel="Check-in feito"
      >
        <Animated.View style={[styles.flash, { opacity: flash }]} />
        <IconeCheck cor={Cores.checkinValidado} tamanho={18} />
        <Text style={styles.seloTexto}>Feito</Text>
      </Animated.View>
    );
  }

  if (estado === 'foraDaJanela') {
    return (
      <View style={styles.selo} accessibilityRole="text" accessibilityLabel={motivo ?? 'Check-in indisponível'}>
        <IconeCadeado cor={Cores.alerta} tamanho={16} />
        <Text style={styles.seloTextoFechado}>{motivo}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.botao, carregando && styles.botaoCarregando]}
      onPress={onPress}
      disabled={carregando}
      accessibilityRole="button"
      accessibilityLabel={carregando ? 'Enviando check-in' : 'Fazer check-in'}
      accessibilityState={{ disabled: Boolean(carregando), busy: Boolean(carregando) }}
    >
      {carregando ? (
        <ActivityIndicator color={Cores.branco} size="small" />
      ) : (
        <>
          <IconeLuva cor={Cores.branco} tamanho={16} />
          <Text style={styles.textoBotao}>Fazer check-in</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.minimo,
    backgroundColor: Cores.preto,
    borderRadius: Raios.medio,
    paddingVertical: Espacamento.pequeno,
    paddingHorizontal: Espacamento.medio,
    minHeight: 44,
    minWidth: 44,
  },
  botaoCarregando: { opacity: 0.7 },
  textoBotao: { color: Cores.branco, fontWeight: '600', fontSize: TamanhoFonte.xs },

  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.minimo,
    minHeight: 44,
    paddingHorizontal: Espacamento.pequeno,
    borderRadius: Raios.medio,
    position: 'relative',
    overflow: 'hidden',
  },
  // Flash de "impacto" (script.md, item 3) — Cores.impacto, não checkinValidado: é o mesmo verde
  // só que mais saturado, reservado pra esse instante de meio segundo, nunca pro selo em repouso.
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Cores.impacto },
  seloTexto: { color: Cores.checkinValidado, fontSize: TamanhoFonte.xs, fontWeight: '600' },
  seloTextoFechado: { color: Cores.alerta, fontSize: TamanhoFonte.xs, maxWidth: 120, textAlign: 'right' },
});
