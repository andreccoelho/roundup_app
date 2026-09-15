// RF02: login por e-mail/senha, autenticação delegada ao Firebase; recuperação de senha e
// cadastro vivem em telas próprias (RecuperarSenhaScreen, SelecaoPerfilScreen).
// Sem os 4 estados de carregando/vazio/erro/conteúdo: é um formulário sem busca de dados no
// mount, só ação de envio (já representada pelo `carregando` do próprio Botao "Entrar").
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
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
          <IconeCorda tamanho={32} cor={Cores.cinzaClaro} espessura={1.2} />
        </View>

        <View style={styles.corpo}>
          {erroConta ? (
            <Text style={styles.erroConta} accessibilityRole="alert">
              {erroConta}
            </Text>
          ) : null}

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

          {__DEV__ ? (
            <View style={styles.rodapeDev}>
              <Botao titulo="Galeria de componentes (dev)" variante="texto" onPress={() => navigation.navigate('Galeria')} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Cores.branco },
  scroll: { flexGrow: 1 },
  banda: {
    backgroundColor: Cores.preto,
    paddingTop: Espacamento.enorme * 2,
    paddingBottom: Espacamento.extraGrande + Espacamento.pequeno,
    alignItems: 'center',
  },
  wordmark: { color: Cores.branco, fontSize: TamanhoFonte.xxl, fontWeight: '700', letterSpacing: 1 },
  tagline: { color: Cores.cinzaClaro, fontSize: TamanhoFonte.sm, marginTop: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  corpo: { paddingHorizontal: Espacamento.grande, paddingTop: Espacamento.extraGrande, paddingBottom: Espacamento.grande },
  erroConta: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.padrao },
  linhaEsqueci: { alignItems: 'flex-end', marginBottom: Espacamento.grande, marginTop: -Espacamento.pequeno },
  rodape: { flexDirection: 'row', justifyContent: 'center', gap: Espacamento.pequeno, marginTop: Espacamento.padrao },
  rodapeTexto: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm },
  rodapeDev: { alignItems: 'center', marginTop: Espacamento.extraGrande },
});
