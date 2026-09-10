import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';

const semAnelDeFoco = { outlineWidth: 0 } as const;

interface BotaoProps {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
  variante?: 'primario' | 'texto';
}

export default function Botao({ titulo, onPress, carregando, desabilitado, variante = 'primario' }: BotaoProps) {
  const inativo = Boolean(carregando || desabilitado);

  if (variante === 'texto') {
    return (
      <TouchableOpacity style={semAnelDeFoco} onPress={onPress} disabled={inativo}>
        <Text style={styles.textoLink}>{titulo}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.botao, inativo && styles.botaoDesabilitado, semAnelDeFoco]}
      onPress={onPress}
      disabled={inativo}
    >
      {carregando ? <ActivityIndicator color={Colors.branco} /> : <Text style={styles.texto}>{titulo}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    backgroundColor: Colors.preto,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  botaoDesabilitado: { backgroundColor: Colors.cinzaClaro },
  texto: { color: Colors.branco, fontSize: FontSize.md, fontWeight: '600', letterSpacing: 0.3 },
  textoLink: { color: Colors.cinzaMedio, fontSize: FontSize.sm, textDecorationLine: 'underline', textAlign: 'center' },
});
