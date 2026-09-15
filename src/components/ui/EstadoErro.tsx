// EstadoErro — mensagem + ação de repetir. Achado da auditoria: nenhuma tela tinha isso antes,
// todas mostravam só um <Text> de erro (ou Alert.alert) sem forma de tentar de novo.
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import Botao from './Botao';

interface EstadoErroProps {
  mensagem: string;
  onTentarNovamente: () => void;
}

export default function EstadoErro({ mensagem, onTentarNovamente }: EstadoErroProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.mensagem}>{mensagem}</Text>
      <View style={styles.espaco} />
      <Botao titulo="Tentar novamente" variante="secundario" onPress={onTentarNovamente} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Espacamento.grande },
  mensagem: { color: Cores.alerta, fontSize: TamanhoFonte.md, textAlign: 'center' },
  espaco: { height: Espacamento.padrao },
});
