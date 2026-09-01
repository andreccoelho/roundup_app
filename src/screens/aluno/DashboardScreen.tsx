import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { criarVinculo } from '../../services/vinculos';
import { Vinculo } from '../../types';

// TODO: remover após validar a regra de segurança de vinculos
// Substituir pelo UID real de outro usuário de teste (Authentication → Users no console)
const UID_DESTINATARIO_TESTE = "z7kUnQfCpjds0GFGBpzZu5NzVFB2";

export default function DashboardScreen() {
  const { logout, usuario } = useAuth();

  // TODO: remover após validar a regra de segurança de vinculos
  async function handleTestarCriarVinculo() {
    if (!usuario) return;
    try {
      const agora = new Date();
      const vinculo: Vinculo = {
        id: `${usuario.id}_${UID_DESTINATARIO_TESTE}`,
        tipo: 'aluno-professor',
        solicitanteId: usuario.id,
        destinatarioId: UID_DESTINATARIO_TESTE,
        status: 'pendente',
        criadoEm: agora,
        atualizadoEm: agora,
      };
      await criarVinculo(vinculo);
      Alert.alert('Sucesso', 'Vínculo criado com sucesso.');
    } catch (erro: any) {
      Alert.alert('Erro ao criar vínculo', erro.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Dashboard — Aluno</Text>
      {/* TODO: remover após validar a regra de segurança de vinculos */}
      <TouchableOpacity style={styles.botaoTeste} onPress={handleTestarCriarVinculo}>
        <Text style={styles.textoBotaoTeste}>Testar criarVinculo</Text>
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
  botaoTeste: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.preto,
  },
  textoBotaoTeste: {
    color: Colors.preto,
    fontWeight: 'bold',
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
