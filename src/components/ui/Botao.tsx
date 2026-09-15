import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Cores, Espacamento, Raios, TamanhoFonte } from '../../theme';

const semAnelDeFoco = { outlineWidth: 0 } as const;

type VarianteCheia = 'primario' | 'secundario' | 'fantasma' | 'destrutivo';

interface BotaoProps {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
  variante?: VarianteCheia | 'texto';
  accessibilityLabel?: string;
}

const ESTILOS_POR_VARIANTE: Record<VarianteCheia, { container: ViewStyle; texto: TextStyle; corIndicador: string }> = {
  primario: {
    container: { backgroundColor: Cores.preto },
    texto: { color: Cores.branco },
    corIndicador: Cores.branco,
  },
  secundario: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Cores.cinzaEscuro },
    texto: { color: Cores.cinzaEscuro },
    corIndicador: Cores.cinzaEscuro,
  },
  fantasma: {
    container: { backgroundColor: 'transparent' },
    texto: { color: Cores.preto },
    corIndicador: Cores.preto,
  },
  destrutivo: {
    container: { backgroundColor: Cores.alerta },
    texto: { color: Cores.branco },
    corIndicador: Cores.branco,
  },
};

export default function Botao({ titulo, onPress, carregando, desabilitado, variante = 'primario', accessibilityLabel }: BotaoProps) {
  const inativo = Boolean(carregando || desabilitado);

  if (variante === 'texto') {
    return (
      <TouchableOpacity
        style={semAnelDeFoco}
        onPress={onPress}
        disabled={inativo}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? titulo}
        accessibilityState={{ disabled: inativo }}
      >
        <Text style={styles.textoLink}>{titulo}</Text>
      </TouchableOpacity>
    );
  }

  const estilos = ESTILOS_POR_VARIANTE[variante];

  return (
    <TouchableOpacity
      style={[styles.botao, estilos.container, inativo && styles.botaoDesabilitado, semAnelDeFoco]}
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityState={{ disabled: inativo, busy: Boolean(carregando) }}
    >
      {carregando ? <ActivityIndicator color={estilos.corIndicador} /> : <Text style={[styles.texto, estilos.texto]}>{titulo}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    paddingVertical: Espacamento.padrao,
    paddingHorizontal: Espacamento.padrao,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Raios.pequeno,
    minHeight: 44,
    minWidth: 44,
  },
  botaoDesabilitado: { opacity: 0.4 },
  texto: { fontSize: TamanhoFonte.md, fontWeight: '600', letterSpacing: 0.3 },
  textoLink: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm, textDecorationLine: 'underline', textAlign: 'center' },
});
