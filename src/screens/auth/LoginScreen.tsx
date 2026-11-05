// RF02: login por e-mail/senha, autenticação delegada ao Firebase; recuperação de senha e
// cadastro vivem em telas próprias (RecuperarSenhaScreen, SelecaoPerfilScreen).
// Sem os 4 estados de carregando/vazio/erro/conteúdo: é um formulário sem busca de dados no
// mount, só ação de envio (já representada pelo `carregando` do próprio Botao "Entrar").
//
// Visual (docs/DESIGN.md): tela limpa no fundo agrupado, logo do tema, título em Large Title,
// campos arredondados preenchidos e o botão principal fixo no rodapé — o KeyboardAvoidingView da
// Tela sobe o rodapé junto com o teclado. Enter no e-mail vai para a senha; Enter na senha envia.
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { criarEstilos, Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { emailValido } from '../../utils/validacaoCadastro';
import { mensagemErroAutenticacao } from '../../utils/mensagensErro';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import CampoTexto from '../../components/ui/CampoTexto';
import Botao from '../../components/ui/Botao';
import MensagemErro from '../../components/ui/MensagemErro';
import Logo from '../../components/Logo';

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Login'>>();
  const refSenha = useRef<TextInput>(null);
  const styles = useEstilos();

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
    if (carregando) return;
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
    <Tela largura="formulario" bordas={['topo', 'base']} teclado agrupada>
      <View style={styles.marca}>
        <Logo tamanho={112} rotulo="RoundUp" style={styles.logo} />
        <Texto variante="largeTitle" alinhamento="center">
          Entrar
        </Texto>
        <Texto variante="body" cor="texto2" alinhamento="center" style={styles.tagline}>
          Treine. Evolua. Suba de nível.
        </Texto>
      </View>

      <MensagemErro mensagem={erroConta} />

      <CampoTexto
        rotulo="E-mail"
        placeholder="seuemail@exemplo.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => refSenha.current?.focus()}
        valor={email}
        onAlterar={setEmail}
        erro={erros.email}
      />
      <CampoTexto
        refCampo={refSenha}
        rotulo="Senha"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
        valor={senha}
        onAlterar={setSenha}
        erro={erros.senha}
      />
      <Botao titulo="Esqueci minha senha" variante="texto" alinhar="fim" onPress={() => navigation.navigate('RecuperarSenha')} />

      {/* Empurra o rodapé para a base da tela (e para cima do teclado) */}
      <View style={styles.espaco} />

      <View style={styles.rodape}>
        <Botao titulo="Entrar" onPress={handleLogin} carregando={carregando} />
        <View style={styles.cadastro}>
          <Texto variante="subheadline">Não tem conta?</Texto>
          <Botao titulo="Cadastre-se" variante="texto" onPress={() => navigation.navigate('SelecaoPerfil')} />
        </View>
        {__DEV__ ? (
          <View {...({ dataSet: { dev: 'galeria' } } as object)}>
            <Botao titulo="Galeria de componentes (dev)" variante="texto" onPress={() => navigation.navigate('Galeria')} />
          </View>
        ) : null}
      </View>
    </Tela>
  );
}

const useEstilos = criarEstilos(() => ({
  marca: { alignItems: 'center', paddingTop: Espacamento.grande, paddingBottom: Espacamento.grande },
  // O PNG tem ~20% de área transparente acima e abaixo da marca (1200×1200, marca em y 235-966).
  logo: { marginVertical: -18, marginBottom: Espacamento.minimo },
  tagline: { marginTop: Espacamento.minimo },
  espaco: { flexGrow: 1, minHeight: Espacamento.grande },
  rodape: { gap: Espacamento.minimo },
  cadastro: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Espacamento.minimo },
}));
