import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardScreen() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Dashboard — Professor</Text>
      <TouchableOpacity style={styles.botaoLogout} onPress={logout}>
        <Text style={styles.textoBotaoLogout}>Sair</Text>
      </TouchableOpacity>
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
  botaoLogout: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.preto,
  },
  textoBotaoLogout: {
    color: Colors.branco,
    fontWeight: 'bold',
  },
});
