// RF01, RF05: cadastro do perfil Professor — nome, e-mail, senha, modalidade(s) lecionada(s),
// graduação, indicação inicial de atuação autônoma ou vinculada (RN06: nasce autônomo por
// padrão; o vínculo de fato com uma academia é RF07, feito depois via VincularProfessorScreen).
// Sem os 4 estados de carregando/vazio/erro de tela: formulário sem busca de dados no mount, só
// ação de envio (já representada pelo `carregando` do próprio Botao).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Cores, Espacamento, FamiliaFonte, Raios, Sombras, TamanhoFonte } from '../../theme';
import { MODALIDADE_OUTRA } from '../../constants/modalidades';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { criarConsentimento } from '../../services/consentimentosLGPD';
import { emailValido, senhaValida, resolverModalidades, TAMANHO_MINIMO_SENHA } from '../../utils/validacaoCadastro';
import { ehErroDeAutenticacao, mensagemErroAutenticacao, MENSAGEM_ERRO_PERSISTENCIA } from '../../utils/mensagensErro';
import CampoTexto from '../../components/ui/CampoTexto';
import Botao from '../../components/ui/Botao';
import Abas from '../../components/ui/Abas';
import Texto from '../../components/ui/Texto';
import ModalitySelector from '../../components/ui/ModalitySelector';

type Rota = RouteProp<AuthStackParamList, 'CadastroProfessor'>;

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
  const { consentimentoAceito, versaoConsentimento } = useRoute<Rota>().params;

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
      const novoUsuario = await cadastrar(email.trim(), senha, {
        nome: nome.trim(),
        perfil: 'professor',
        modalidades: resolverModalidades(modalidades, outraModalidade, MODALIDADE_OUTRA),
        graduacao: graduacao.trim(),
        autonomo,
      });
      // RF28: ver comentário equivalente em CadastroAlunoScreen.tsx.
      try {
        await criarConsentimento({
          usuarioId: novoUsuario.id,
          versao: versaoConsentimento,
          aceito: consentimentoAceito,
        });
      } catch {
        // Silencioso de propósito — ver CadastroAlunoScreen.tsx.
      }
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
        <Botao variante="voltar" onPress={() => navigation.goBack()} />

        <Text style={styles.titulo}>Cadastro</Text>
        <Text style={styles.subtitulo}>Professor</Text>

        {erroConta ? (
          <Text style={styles.erroConta} accessibilityRole="alert">
            {erroConta}
          </Text>
        ) : null}

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
          <Texto variante="legenda" style={styles.rotuloToggle}>
            Atuação
          </Texto>
          <Abas
            accessibilityLabel="Atuação"
            opcoes={[
              { valor: 'autonomo', rotulo: 'Autônomo' },
              { valor: 'vinculado', rotulo: 'Vinculado a academia' },
            ]}
            selecionada={autonomo ? 'autonomo' : 'vinculado'}
            onSelecionar={(valor) => setAutonomo(valor === 'autonomo')}
          />
          <Texto variante="legenda" cor="texto3" style={styles.ajudaToggle}>
            {autonomo
              ? 'Você mantém suas próprias turmas e alunos.'
              : 'Você poderá solicitar o vínculo com uma academia depois de entrar.'}
          </Texto>
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
  flex: { flex: 1, backgroundColor: Cores.fundo },
  scroll: { flexGrow: 1, paddingHorizontal: Espacamento.grande, paddingTop: Espacamento.grande, paddingBottom: Espacamento.extraGrande },
  // script.md, item 2: título de tela em Homebase com efeito de "batida" (sombra dura).
  titulo: {
    fontFamily: FamiliaFonte.display,
    fontSize: TamanhoFonte.xxl,
    color: Cores.texto,
    marginTop: Espacamento.padrao,
  },
  subtitulo: {
    fontSize: TamanhoFonte.md,
    color: Cores.texto2,
    marginTop: Espacamento.minimo / 2,
    marginBottom: Espacamento.grande + Espacamento.minimo,
  },
  erroConta: { color: Cores.perigo, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.padrao },
  campoToggle: { marginBottom: Espacamento.padrao },
  rotuloToggle: { fontSize: TamanhoFonte.sm, color: Cores.texto2, marginBottom: Espacamento.pequeno },
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: Cores.linhaForte, borderRadius: Raios.pilula, overflow: 'hidden' },
  opcaoToggle: {
    flex: 1,
    paddingVertical: Espacamento.medio - Espacamento.minimo / 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  opcaoToggleAtiva: { backgroundColor: Cores.superficie2 },
  textoToggle: { fontSize: TamanhoFonte.sm, color: Cores.linhaForte },
  textoToggleAtivo: { color: Cores.texto, fontWeight: '600' },
  ajudaToggle: { fontSize: TamanhoFonte.xs, color: Cores.texto2, marginTop: Espacamento.pequeno },
  espaco: { height: Espacamento.pequeno },
  rodape: { flexDirection: 'row', justifyContent: 'center', gap: Espacamento.pequeno, marginTop: Espacamento.padrao },
  rodapeTexto: { color: Cores.texto2, fontSize: TamanhoFonte.sm },
});
