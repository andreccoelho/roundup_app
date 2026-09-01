import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Login</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.branco,
  },
  titulo: {
    fontSize: 24,
    color: Colors.preto,
  },
});
