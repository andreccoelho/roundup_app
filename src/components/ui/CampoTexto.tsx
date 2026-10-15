// Campo de texto sublinhado — evita o "kit de card de SaaS" (caixa branca com borda cinza e
// raio 12); usado nos 5 formulários deste fluxo (login, recuperar senha, 3 cadastros).
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Cores } from '../../theme';
import { TamanhoFonte } from '../../theme';

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
        placeholderTextColor={Cores.texto3}
        {...resto}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  rotulo: { fontSize: TamanhoFonte.sm, color: Cores.texto2, marginBottom: 6 },
  campo: {
    borderBottomWidth: 1,
    borderBottomColor: Cores.linha,
    paddingVertical: 8,
    fontSize: TamanhoFonte.md,
    color: Cores.texto,
    // RN Web deixa o anel de foco azul padrão do navegador nos inputs sublinhados — quebra a
    // paleta monocromática do brief.
    outlineWidth: 0,
  },
  campoComErro: { borderBottomColor: Cores.perigo },
  erro: { fontSize: TamanhoFonte.xs, color: Cores.perigo, marginTop: 4 },
});
