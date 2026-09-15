// Etiqueta/chip de seleção — consolida os 3 chips reimplementados em gestor/TurmasScreen.tsx
// (nível), gestor/TurmaDetalheScreen.tsx (dias da semana) e professor/DashboardScreen.tsx
// (seletor de turma). Alvo de toque de 44x44 via hitSlop, sem inflar o tamanho visual do chip.
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Cores, Espacamento, Raios, TamanhoFonte } from '../../theme';

interface EtiquetaProps {
  texto: string;
  selecionada?: boolean;
  onPress?: () => void;
  desabilitada?: boolean;
  accessibilityLabel?: string;
}

export default function Etiqueta({ texto, selecionada, onPress, desabilitada, accessibilityLabel }: EtiquetaProps) {
  const conteudo = (
    <View style={[styles.etiqueta, selecionada && styles.etiquetaSelecionada, desabilitada && styles.etiquetaDesabilitada]}>
      <Text style={[styles.texto, selecionada && styles.textoSelecionado]}>{texto}</Text>
    </View>
  );

  if (!onPress) return conteudo;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={desabilitada}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? texto}
      accessibilityState={{ selected: Boolean(selecionada), disabled: Boolean(desabilitada) }}
    >
      {conteudo}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    borderWidth: 1,
    borderColor: Cores.cinzaEscuro,
    borderRadius: Raios.grande,
    paddingVertical: Espacamento.pequeno,
    paddingHorizontal: Espacamento.medio,
  },
  etiquetaSelecionada: { backgroundColor: Cores.preto, borderColor: Cores.preto },
  etiquetaDesabilitada: { opacity: 0.4 },
  texto: { fontSize: TamanhoFonte.sm, color: Cores.cinzaEscuro },
  textoSelecionado: { color: Cores.branco, fontWeight: '600' },
});
