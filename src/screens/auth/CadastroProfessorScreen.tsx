// RF01, RF05: cadastro do perfil Professor — nome, e-mail, senha, modalidade(s) lecionada(s),
// graduação, indicação inicial de atuação autônoma ou vinculada (RN06: nasce autônomo por
// padrão; o vínculo de fato com uma academia é RF07, feito depois via VincularProfessorScreen).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { MODALIDADE_OUTRA } from '../../constants/modalidades';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { emailValido, senhaValida, resolverModalidades, TAMANHO_MINIMO_SENHA } from '../../utils/validacaoCadastro';
import { ehErroDeAutenticacao, mensagemErroAutenticacao, MENSAGEM_ERRO_PERSISTENCIA } from '../../utils/mensagensErro';
import CampoTexto from '../../components/ui/CampoTexto';
import Botao from '../../components/ui/Botao';
import ModalitySelector from '../../components/ui/ModalitySelector';

const semAnelDeFoco = { outlineWidth: 0 } as const;

interface Erros {
  nome?: string;
  email?: string;
  senha?: string;
  confirmarSenha?: string;
  modalidades?: string;
  graduacao?: string;
}

export default function CadastroProfessorScreen() {
  const { cadastrar } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'CadastroProfessor'>>();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [outraModalidade, setOutraModalidade] = useState('');
  const [graduacao, setGraduacao] = useState('');
  const [autonomo, setAutonomo] = useState(true);

  const [erros, setErros] = useState<Erros>({});
  const [erroConta, setErroConta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  function validar(): boolean {
    const novosErros: Erros = {};
    if (!nome.trim()) novosErros.nome = 'Informe seu nome.';
    if (!email.trim()) novosErros.email = 'Informe seu e-mail.';
    else if (!emailValido(email)) novosErros.email = 'E-mail inválido.';
    if (!senhaValida(senha)) novosErros.senha = `Use ao menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
    if (confirmarSenha !== senha) novosErros.confirmarSenha = 'As senhas não coincidem.';
    if (resolverModalidades(modalidades, outraModalidade, MODALIDADE_OUTRA).length === 0) {
      novosErros.modalidades = 'Selecione ao menos uma modalidade.';
    }
    if (!graduacao.trim()) novosErros.graduacao = 'Informe sua graduação.';

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function handleCadastrar() {
    setErroConta(null);
    if (!validar()) return;
    setCarregando(true);
    try {
      await cadastrar(email.trim(), senha, {
        nome: nome.trim(),
        perfil: 'professor',
        modalidades: resolverModalidades(modalidades, outraModalidade, MODALIDADE_OUTRA),
        graduacao: graduacao.trim(),
        autonomo,
      });
    } catch (erro: any) {
      setErroConta(
        ehErroDeAutenticacao(erro) ? mensagemErroAutenticacao(erro?.code) : MENSAGEM_ERRO_PERSISTENCIA
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Botao titulo="‹ Voltar" variante="texto" onPress={() => navigation.goBack()} />

        <Text style={styles.titulo}>Cadastro</Text>
        <Text style={styles.subtitulo}>Professor</Text>

        {erroConta ? <Text style={styles.erroConta}>{erroConta}</Text> : null}

        <CampoTexto rotulo="Nome" placeholder="Seu nome completo" valor={nome} onAlterar={setNome} erro={erros.nome} />
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
        <CampoTexto rotulo="Senha" placeholder="••••••••" secureTextEntry valor={senha} onAlterar={setSenha} erro={erros.senha} />
        <CampoTexto
          rotulo="Confirmar senha"
          placeholder="••••••••"
          secureTextEntry
          valor={confirmarSenha}
          onAlterar={setConfirmarSenha}
          erro={erros.confirmarSenha}
        />

        <ModalitySelector
          rotulo="Modalidade(s) que leciona"
          selecionadas={modalidades}
          outraTexto={outraModalidade}
          onAlterarSelecionadas={setModalidades}
          onAlterarOutraTexto={setOutraModalidade}
          erro={erros.modalidades}
        />

        <CampoTexto
          rotulo="Graduação"
          placeholder="Ex.: Faixa preta, 1º grau"
          valor={graduacao}
          onAlterar={setGraduacao}
          erro={erros.graduacao}
        />

        <View style={styles.campoToggle}>
          <Text style={styles.rotuloToggle}>Atuação</Text>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.opcaoToggle, autonomo && styles.opcaoToggleAtiva, semAnelDeFoco]}
              onPress={() => setAutonomo(true)}
            >
              <Text style={[styles.textoToggle, autonomo && styles.textoToggleAtivo]}>Autônomo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.opcaoToggle, !autonomo && styles.opcaoToggleAtiva, semAnelDeFoco]}
              onPress={() => setAutonomo(false)}
            >
              <Text style={[styles.textoToggle, !autonomo && styles.textoToggleAtivo]}>Vinculado a academia</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.ajudaToggle}>
            {autonomo
              ? 'Você mantém suas próprias turmas e alunos.'
              : 'Você poderá solicitar o vínculo com uma academia depois de entrar.'}
          </Text>
        </View>

        <View style={styles.espaco} />
        <Botao titulo="Criar conta" onPress={handleCadastrar} carregando={carregando} />

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>Já tem conta?</Text>
          <Botao titulo="Entrar" variante="texto" onPress={() => navigation.navigate('Login')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.branco },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  titulo: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.preto, marginTop: 16 },
  subtitulo: { fontSize: FontSize.md, color: Colors.cinzaMedio, marginTop: 2, marginBottom: 28 },
  erroConta: { color: Colors.alerta, fontSize: FontSize.sm, marginBottom: 16 },
  campoToggle: { marginBottom: 20 },
  rotuloToggle: { fontSize: FontSize.sm, color: Colors.cinzaMedio, marginBottom: 8 },
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: Colors.cinzaEscuro, borderRadius: 20, overflow: 'hidden' },
  opcaoToggle: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  opcaoToggleAtiva: { backgroundColor: Colors.preto },
  textoToggle: { fontSize: FontSize.sm, color: Colors.cinzaEscuro },
  textoToggleAtivo: { color: Colors.branco, fontWeight: '600' },
  ajudaToggle: { fontSize: FontSize.xs, color: Colors.cinzaMedio, marginTop: 8 },
  espaco: { height: 8 },
  rodape: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 },
  rodapeTexto: { color: Colors.cinzaMedio, fontSize: FontSize.sm },
});
