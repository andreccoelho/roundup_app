import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

// Separador de lista fino, no lugar do "card branco com borda" repetido em toda a tela.
export default function LinhaFina() {
  return <View style={styles.linha} />;
}

const styles = StyleSheet.create({
  linha: { height: 1, backgroundColor: Colors.cinzaBorda },
});
