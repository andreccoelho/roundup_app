import { View, StyleSheet } from 'react-native';
import { Cores } from '../theme';

// Separador de lista, no lugar do "card branco com borda" repetido em toda a tela.
// script.md, item 1: "divisores de seção podem imitar corda de ringue (linha dupla) em vez de
// linha reta simples" — duas linhas finas próximas, não uma linha grossa só.
export default function LinhaFina() {
  return (
    <View style={styles.container}>
      <View style={styles.linha} />
      <View style={styles.linha} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 2 },
  linha: { height: 1, backgroundColor: Cores.linha },
});
