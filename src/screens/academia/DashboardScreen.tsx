import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { AcademiaStackParamList } from '../../navigation/AcademiaStack';

export default function DashboardScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AcademiaStackParamList, 'Dashboard'>>();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Dashboard — Academia</Text>
      <TouchableOpacity style={styles.botaoPrimario} onPress={() => navigation.navigate('SolicitacoesAcademia')}>
        <Text style={styles.textoBotaoPrimario}>Solicitações pendentes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.botaoPrimario} onPress={() => navigation.navigate('Turmas')}>
        <Text style={styles.textoBotaoPrimario}>Turmas</Text>
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
    marginBottom: 8,
  },
  botaoPrimario: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.preto,
  },
  textoBotaoPrimario: {
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
