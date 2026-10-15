// RF02: login por e-mail/senha, autenticação delegada ao Firebase; recuperação de senha e
// cadastro vivem em telas próprias (RecuperarSenhaScreen, SelecaoPerfilScreen).
// Sem os 4 estados de carregando/vazio/erro/conteúdo: é um formulário sem busca de dados no
// mount, só ação de envio (já representada pelo `carregando` do próprio Botao "Entrar").
//
// Visual (docs/DESIGN.md): tela cheia escura, logo invertido, tagline display, CTA em acento.
// Enter no e-mail vai para a senha; Enter na senha envia.
import { useRef, useState } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Espacamento, Sombras } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { emailValido } from '../../utils/validacaoCadastro';
import { mensagemErroAutenticacao } from '../../utils/mensagensErro';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import CampoTexto from '../../components/ui/CampoTexto';
import Botao from '../../components/ui/Botao';
import MensagemErro from '../../components/ui/MensagemErro';

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Login'>>();
  const refSenha = useRef<TextInput>(null);

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
    <Tela largura="formulario" bordas={['topo', 'base']} teclado>
      <View style={styles.marca}>
        <Image
          source={require('../../../assets/roundup_logo_invertida.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="RoundUp"
        />
        <Texto variante="display" alinhamento="center" style={[styles.tagline, Sombras.duraAcento]}>
          {'Treine. Evolua.\nSuba de nível.'}
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

      <View style={styles.esqueci}>
        <Botao titulo="Esqueci minha senha" variante="texto" alinhar="fim" onPress={() => navigation.navigate('RecuperarSenha')} />
      </View>

      <Botao titulo="Entrar" grande onPress={handleLogin} carregando={carregando} />

      <View style={styles.rodape}>
        <Texto variante="legenda">Não tem conta?</Texto>
        <Botao titulo="Cadastre-se" variante="texto" onPress={() => navigation.navigate('SelecaoPerfil')} />
      </View>

      {__DEV__ ? (
        <View style={styles.dev}>
          <Botao titulo="Galeria de componentes (dev)" variante="texto" onPress={() => navigation.navigate('Galeria')} />
        </View>
      ) : null}
    </Tela>
  );
}

const styles = StyleSheet.create({
  marca: { alignItems: 'center', paddingTop: Espacamento.extraGrande, paddingBottom: Espacamento.extraGrande },
  // O PNG tem ~20% de área transparente acima e abaixo da marca (1200×1200, marca em y 235-966).
  logo: { width: 240, height: 240, marginVertical: -46 },
  tagline: { marginTop: Espacamento.grande },
  esqueci: { marginTop: -Espacamento.pequeno, marginBottom: Espacamento.padrao },
  rodape: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Espacamento.pequeno, marginTop: Espacamento.padrao },
  dev: { marginTop: Espacamento.grande },
});
