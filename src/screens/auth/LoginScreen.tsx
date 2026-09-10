// RF02: login por e-mail/senha, autenticação delegada ao Firebase; recuperação de senha e
// cadastro vivem em telas próprias (RecuperarSenhaScreen, SelecaoPerfilScreen).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { emailValido } from '../../utils/validacaoCadastro';
import { mensagemErroAutenticacao } from '../../utils/mensagensErro';
import CampoTexto from '../../components/ui/CampoTexto';
import Botao from '../../components/ui/Botao';
import { IconeCorda } from '../../components/icones';

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Login'>>();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [erroConta, setErroConta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  function validar(): boolean {
    const novosErros: { email?: string; senha?: string } = {};
    if (!email.trim()) novosErros.email = 'Informe seu e-mail.';
    else if (!emailValido(email)) novosErros.email = 'E-mail inválido.';
    if (!senha) novosErros.senha = 'Informe sua senha.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function handleLogin() {
    setErroConta(null);
    if (!validar()) return;
    setCarregando(true);
    try {
      await login(email.trim(), senha);
    } catch (erro: any) {
      setErroConta(mensagemErroAutenticacao(erro?.code));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.banda}>
          <Text style={styles.wordmark}>RoundUp</Text>
          <Text style={styles.tagline}>Treine. Evolua. Suba de nível.</Text>
          <IconeCorda tamanho={32} cor={Colors.cinzaClaro} espessura={1.2} />
        </View>

        <View style={styles.corpo}>
          {erroConta ? <Text style={styles.erroConta}>{erroConta}</Text> : null}

          <CampoTexto
            rotulo="E-mail"
            placeholder="seuemail@exemplo.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            valor={email}
            onAlterar={setEmail}
            erro={erros.email}
          />
          <CampoTexto
            rotulo="Senha"
            placeholder="••••••••"
            secureTextEntry
            valor={senha}
            onAlterar={setSenha}
            erro={erros.senha}
          />

          <View style={styles.linhaEsqueci}>
            <Botao
              titulo="Esqueci minha senha"
              variante="texto"
              onPress={() => navigation.navigate('RecuperarSenha')}
            />
          </View>

          <Botao titulo="Entrar" onPress={handleLogin} carregando={carregando} />

          <View style={styles.rodape}>
            <Text style={styles.rodapeTexto}>Não tem conta?</Text>
            <Botao
              titulo="Cadastre-se"
              variante="texto"
              onPress={() => navigation.navigate('SelecaoPerfil')}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.branco },
  scroll: { flexGrow: 1 },
  banda: {
    backgroundColor: Colors.preto,
    paddingTop: 96,
    paddingBottom: 40,
    alignItems: 'center',
  },
  wordmark: { color: Colors.branco, fontSize: FontSize.xxl, fontWeight: '700', letterSpacing: 1 },
  tagline: { color: Colors.cinzaClaro, fontSize: FontSize.sm, marginTop: 8, marginBottom: 20 },
  corpo: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  erroConta: { color: Colors.alerta, fontSize: FontSize.sm, marginBottom: 16 },
  linhaEsqueci: { alignItems: 'flex-end', marginBottom: 24, marginTop: -8 },
  rodape: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 },
  rodapeTexto: { color: Colors.cinzaMedio, fontSize: FontSize.sm },
});
