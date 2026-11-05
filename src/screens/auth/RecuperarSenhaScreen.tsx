// RF02: recuperação de senha por e-mail, delegada ao Firebase Auth.
// Sem os 4 estados de carregando/vazio/erro de tela: formulário sem busca de dados no mount, só
// ação de envio (já representada pelo `carregando` do próprio Botao).
import { useState } from 'react';
import { View } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { criarEstilos, Espacamento, Raios, useTema } from '../../theme';
import { auth } from '../../services/firebase';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { emailValido } from '../../utils/validacaoCadastro';
import { mensagemErroAutenticacao } from '../../utils/mensagensErro';
import CampoTexto from '../../components/ui/CampoTexto';
import Botao from '../../components/ui/Botao';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import MensagemErro from '../../components/ui/MensagemErro';
import { IconeCheckCirculo } from '../../components/icones';

export default function RecuperarSenhaScreen() {
  const styles = useEstilos();
  const { cores } = useTema();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'RecuperarSenha'>>();

  const [email, setEmail] = useState('');
  const [erroEmail, setErroEmail] = useState<string | undefined>();
  const [erroConta, setErroConta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleEnviar() {
    if (carregando) return;
    setErroConta(null);
    if (!email.trim()) {
      setErroEmail('Informe seu e-mail.');
      return;
    }
    if (!emailValido(email)) {
      setErroEmail('E-mail inválido.');
      return;
    }
    setErroEmail(undefined);
    setCarregando(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setEnviado(true);
    } catch (erro: any) {
      setErroConta(mensagemErroAutenticacao(erro?.code));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Tela largura="formulario" bordas={['topo', 'base']} teclado agrupada>
      <Botao variante="voltar" onPress={() => navigation.goBack()} />

      <Texto variante="largeTitle" style={styles.titulo}>
        Recuperar senha
      </Texto>
      <Texto variante="body" cor="texto2" style={styles.subtitulo}>
        Informe o e-mail da sua conta. Se ele existir, enviaremos um link para redefinir a senha.
      </Texto>

      {enviado ? (
        <View style={styles.confirmacao} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <IconeCheckCirculo tamanho={24} cor={cores.sucesso} preenchido />
          <Texto variante="body" style={styles.confirmacaoTexto}>
            {`Se ${email.trim()} estiver cadastrado, o link de recuperação já foi enviado.`}
          </Texto>
        </View>
      ) : (
        <>
          <MensagemErro mensagem={erroConta} />
          <CampoTexto
            rotulo="E-mail"
            placeholder="seuemail@exemplo.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={handleEnviar}
            valor={email}
            onAlterar={setEmail}
            erro={erroEmail}
          />
          <Botao titulo="Enviar link" onPress={handleEnviar} carregando={carregando} />
        </>
      )}
    </Tela>
  );
}

const useEstilos = criarEstilos((c) => ({
  titulo: { marginTop: Espacamento.grande },
  subtitulo: { marginTop: Espacamento.pequeno, marginBottom: Espacamento.grande },
  confirmacao: {
    flexDirection: 'row',
    gap: Espacamento.medio,
    alignItems: 'flex-start',
    backgroundColor: c.superficie,
    borderRadius: Raios.lista,
    borderCurve: 'continuous',
    padding: Espacamento.padrao,
  },
  confirmacaoTexto: { flex: 1 },
}));
