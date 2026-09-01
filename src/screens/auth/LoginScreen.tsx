import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { Perfil } from '../../types';

const PERFIS: Perfil[] = ['aluno', 'professor', 'academia'];

export default function LoginScreen() {
  const { login, cadastrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [perfil, setPerfil] = useState<Perfil>('aluno');
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    setCarregando(true);
    try {
      await login(email, senha);
    } catch (erro: any) {
      Alert.alert('Erro ao entrar', erro.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleCadastro() {
    setCarregando(true);
    try {
      await cadastrar(email, senha, nome, perfil);
    } catch (erro: any) {
      Alert.alert('Erro ao cadastrar', erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Login</Text>

        <TextInput
            style={styles.input}
            placeholder="E-mail"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
        />
        <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
        />
        <TextInput
            style={styles.input}
            placeholder="Nome (para criar conta de teste)"
            value={nome}
            onChangeText={setNome}
        />
        <View style={styles.linhaPerfis}>
          {PERFIS.map((opcao) => (
            <TouchableOpacity
                key={opcao}
                style={[styles.chipPerfil, perfil === opcao && styles.chipPerfilSelecionado]}
                onPress={() => setPerfil(opcao)}
            >
              <Text style={[styles.textoChipPerfil, perfil === opcao && styles.textoChipPerfilSelecionado]}>
                {opcao}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {carregando ? (
            <ActivityIndicator color={Colors.preto} />
        ) : (
            <>
              <TouchableOpacity style={styles.botao} onPress={handleLogin}>
                <Text style={styles.textoBotao}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoSecundario} onPress={handleCadastro}>
                <Text style={styles.textoBotaoSecundario}>Criar conta de teste</Text>
              </TouchableOpacity>
            </>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.branco,
    paddingHorizontal: 24,
  },
  titulo: {
    fontSize: 24,
    color: Colors.preto,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.cinzaEscuro,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: Colors.preto,
  },
  linhaPerfis: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chipPerfil: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.cinzaEscuro,
    borderRadius: 8,
    paddingVertical: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  chipPerfilSelecionado: {
    backgroundColor: Colors.preto,
    borderColor: Colors.preto,
  },
  textoChipPerfil: {
    color: Colors.cinzaEscuro,
    fontSize: 12,
  },
  textoChipPerfilSelecionado: {
    color: Colors.branco,
    fontWeight: 'bold',
  },
  botao: {
    width: '100%',
    backgroundColor: Colors.preto,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBotao: {
    color: Colors.branco,
    fontWeight: 'bold',
  },
  botaoSecundario: {
    marginTop: 12,
  },
  textoBotaoSecundario: {
    color: Colors.cinzaEscuro,
    textDecorationLine: 'underline',
  },
});