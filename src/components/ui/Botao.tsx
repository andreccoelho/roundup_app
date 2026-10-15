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
  // Menos padding vertical, pra linhas de ações secundárias lado a lado (ex.: Perfil) não
  // virarem uma pilha de barras cheias — minHeight:44 (alvo de toque) continua garantido.
  compacto?: boolean;
  accessibilityLabel?: string;
}

const ESTILOS_POR_VARIANTE: Record<VarianteCheia, { container: ViewStyle; texto: TextStyle; corIndicador: string }> = {
  primario: {
    container: { backgroundColor: Cores.superficie2 },
    texto: { color: Cores.texto },
    corIndicador: Cores.texto,
  },
  secundario: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Cores.linhaForte },
    texto: { color: Cores.linhaForte },
    corIndicador: Cores.linhaForte,
  },
  fantasma: {
    container: { backgroundColor: 'transparent' },
    texto: { color: Cores.texto },
    corIndicador: Cores.texto,
  },
  destrutivo: {
    container: { backgroundColor: Cores.perigo },
    texto: { color: Cores.texto },
    corIndicador: Cores.texto,
  },
};

export default function Botao({ titulo, onPress, carregando, desabilitado, variante = 'primario', compacto, accessibilityLabel }: BotaoProps) {
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
      style={[styles.botao, estilos.container, compacto && styles.botaoCompacto, inativo && styles.botaoDesabilitado, semAnelDeFoco]}
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityState={{ disabled: inativo, busy: Boolean(carregando) }}
    >
      {carregando ? (
        <ActivityIndicator color={estilos.corIndicador} />
      ) : (
        <Text style={[styles.texto, compacto && styles.textoCompacto, estilos.texto]}>{titulo}</Text>
      )}
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
  botaoCompacto: { paddingVertical: Espacamento.pequeno, paddingHorizontal: Espacamento.medio },
  textoCompacto: { fontSize: TamanhoFonte.sm },
  texto: { fontSize: TamanhoFonte.md, fontWeight: '600', letterSpacing: 0.3 },
  textoLink: { color: Cores.texto2, fontSize: TamanhoFonte.sm, textDecorationLine: 'underline', textAlign: 'center' },
});
