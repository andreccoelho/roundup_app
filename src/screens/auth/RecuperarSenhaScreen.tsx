// RF02: recuperação de senha por e-mail, delegada ao Firebase Auth.
// Sem os 4 estados de carregando/vazio/erro de tela: formulário sem busca de dados no mount, só
// ação de envio (já representada pelo `carregando` do próprio Botao).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { auth } from '../../services/firebase';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { emailValido } from '../../utils/validacaoCadastro';
import { mensagemErroAutenticacao } from '../../utils/mensagensErro';
import CampoTexto from '../../components/ui/CampoTexto';
import Botao from '../../components/ui/Botao';

export default function RecuperarSenhaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'RecuperarSenha'>>();

  const [email, setEmail] = useState('');
  const [erroEmail, setErroEmail] = useState<string | undefined>();
  const [erroConta, setErroConta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleEnviar() {
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Botao titulo="‹ Voltar" variante="texto" onPress={() => navigation.goBack()} />

        <Text style={styles.titulo}>Recuperar senha</Text>
        <Text style={styles.subtitulo}>
          Informe o e-mail da sua conta. Se ele existir, enviaremos um link para redefinir a senha.
        </Text>

        {enviado ? (
          <Text style={styles.confirmacao} accessibilityRole="alert">
            Se {email.trim()} estiver cadastrado, o link de recuperação já foi enviado.
          </Text>
        ) : (
          <>
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
              erro={erroEmail}
            />
            <View style={styles.espaco} />
            <Botao titulo="Enviar link de recuperação" onPress={handleEnviar} carregando={carregando} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Cores.branco },
  scroll: { flexGrow: 1, paddingHorizontal: Espacamento.grande, paddingTop: Espacamento.grande, paddingBottom: Espacamento.grande },
  titulo: { fontSize: TamanhoFonte.xxl, fontWeight: '700', color: Cores.preto, marginTop: Espacamento.padrao },
  subtitulo: {
    fontSize: TamanhoFonte.sm,
    color: Cores.cinzaMedio,
    marginTop: Espacamento.pequeno,
    marginBottom: Espacamento.grande + Espacamento.minimo,
  },
  confirmacao: { fontSize: TamanhoFonte.md, color: Cores.preto },
  erroConta: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.padrao },
  espaco: { height: Espacamento.pequeno },
});
