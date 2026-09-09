import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { AlunoStackParamList } from '../../navigation/AlunoStack';

export default function DashboardScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AlunoStackParamList, 'Dashboard'>>();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Dashboard — Aluno</Text>
      <TouchableOpacity style={styles.botaoVincular} onPress={() => navigation.navigate('VincularAluno')}>
        <Text style={styles.textoBotaoVincular}>Vincular-se</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.botaoVincular} onPress={() => navigation.navigate('TurmasDisponiveis')}>
        <Text style={styles.textoBotaoVincular}>Turmas disponíveis</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.botaoVincular} onPress={() => navigation.navigate('Agenda')}>
        <Text style={styles.textoBotaoVincular}>Agenda</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.botaoVincular} onPress={() => navigation.navigate('Historico')}>
        <Text style={styles.textoBotaoVincular}>Histórico</Text>
      </TouchableOpacity>
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
  botaoVincular: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.preto,
  },
  textoBotaoVincular: {
    color: Colors.branco,
    fontWeight: 'bold',
  },
  botaoLogout: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.preto,
  },
  textoBotaoLogout: {
    color: Colors.preto,
    fontWeight: 'bold',
  },
});
