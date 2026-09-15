// BotaoCheckIn — componente de domínio: os 3 estados visuais de check-in (RN08) — disponível,
// fora da janela, já realizado. Antes duplicado em aluno/DashboardScreen.tsx (CardCheckIn) e
// aluno/AgendaScreen.tsx (ItemSessao); consolidado aqui, cada estado com forma, ícone e texto
// próprios (nunca só mudança de cor), conforme DESIGN_BRIEF.md.
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Cores, Espacamento, Raios, TamanhoFonte } from '../../theme';
import { EstadoCheckIn } from '../../utils/statusCheckIn';
import { IconeCadeado, IconeCheck, IconeLuva } from '../icones';

interface BotaoCheckInProps {
  estado: EstadoCheckIn;
  motivo?: string;
  carregando?: boolean;
  onPress?: () => void;
}

export default function BotaoCheckIn({ estado, motivo, carregando, onPress }: BotaoCheckInProps) {
  if (estado === 'realizado') {
    return (
      <View style={styles.selo} accessibilityRole="text" accessibilityLabel="Check-in feito">
        <IconeCheck cor={Cores.checkinValidado} tamanho={18} />
        <Text style={styles.seloTexto}>Feito</Text>
      </View>
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

  selo: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.minimo, minHeight: 44, paddingHorizontal: Espacamento.minimo },
  seloTexto: { color: Cores.checkinValidado, fontSize: TamanhoFonte.xs, fontWeight: '600' },
  seloTextoFechado: { color: Cores.alerta, fontSize: TamanhoFonte.xs, maxWidth: 120, textAlign: 'right' },
});
