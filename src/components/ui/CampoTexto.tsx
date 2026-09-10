// Campo de texto sublinhado — evita o "kit de card de SaaS" (caixa branca com borda cinza e
// raio 12); usado nos 5 formulários deste fluxo (login, recuperar senha, 3 cadastros).
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';

interface CampoTextoProps
  extends Pick<TextInputProps, 'secureTextEntry' | 'keyboardType' | 'autoCapitalize' | 'autoCorrect' | 'placeholder'> {
  rotulo: string;
  valor: string;
  onAlterar: (texto: string) => void;
  erro?: string;
}

export default function CampoTexto({ rotulo, valor, onAlterar, erro, ...resto }: CampoTextoProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        style={[styles.campo, erro && styles.campoComErro]}
        value={valor}
        onChangeText={onAlterar}
        placeholderTextColor={Colors.cinzaClaro}
        {...resto}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  rotulo: { fontSize: FontSize.sm, color: Colors.cinzaMedio, marginBottom: 6 },
  campo: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.cinzaBorda,
    paddingVertical: 8,
    fontSize: FontSize.md,
    color: Colors.preto,
    // RN Web deixa o anel de foco azul padrão do navegador nos inputs sublinhados — quebra a
    // paleta monocromática do brief.
    outlineWidth: 0,
  },
  campoComErro: { borderBottomColor: Colors.alerta },
  erro: { fontSize: FontSize.xs, color: Colors.alerta, marginTop: 4 },
});
