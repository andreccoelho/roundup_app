import { StyleSheet, View } from 'react-native';
import { Cores } from '../theme';

// Separador de lista (docs/DESIGN.md: listas sem card — linhas sobre o fundo, separadas por
// `linha`). `corda` = duas linhas próximas, para divisor de seção (corda do ringue).
export default function LinhaFina({ corda }: { corda?: boolean }) {
  if (corda) {
    return (
      <View style={styles.corda} aria-hidden>
        <View style={styles.linha} />
        <View style={styles.linha} />
      </View>
    );
  }
  return <View style={styles.linha} aria-hidden />;
}

const styles = StyleSheet.create({
  corda: { gap: 3 },
  linha: { height: 1, backgroundColor: Cores.linha },
});
