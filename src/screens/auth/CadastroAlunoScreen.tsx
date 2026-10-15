// RF01, RF06: cadastro do perfil Aluno — nome, e-mail, senha, modalidade(s) praticada(s),
// faixa ou grau atual. Persiste em Firebase Auth + `usuarios` (Firestore) via useAuth().cadastrar.
// Sem os 4 estados de carregando/vazio/erro de tela: formulário sem busca de dados no mount, só
// ação de envio (já representada pelo `carregando` do próprio Botao).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Cores, Espacamento, FamiliaFonte, Sombras, TamanhoFonte } from '../../theme';
import { MODALIDADE_OUTRA } from '../../constants/modalidades';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { criarConsentimento } from '../../services/consentimentosLGPD';
import { emailValido, senhaValida, resolverModalidades, TAMANHO_MINIMO_SENHA } from '../../utils/validacaoCadastro';
import { ehErroDeAutenticacao, mensagemErroAutenticacao, MENSAGEM_ERRO_PERSISTENCIA } from '../../utils/mensagensErro';
import { parseDataBr, paraTimestamp } from '../../utils/datas';
import CampoTexto from '../../components/ui/CampoTexto';
import Botao from '../../components/ui/Botao';
import ModalitySelector from '../../components/ui/ModalitySelector';

type Rota = RouteProp<AuthStackParamList, 'CadastroAluno'>;

const IDADE_MINIMA_SEM_RESPONSAVEL = 18;

// RF30: idade em anos completos na data de hoje, a partir da data de nascimento.
function calcularIdade(nascimento: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversarioEsteAno =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversarioEsteAno) idade -= 1;
  return idade;
}

interface Erros {
  nome?: string;
  email?: string;
  senha?: string;
  confirmarSenha?: string;
  modalidades?: string;
  faixaOuGrau?: string;
  dataNascimento?: string;
  nomeResponsavel?: string;
  contatoResponsavel?: string;
}

export default function CadastroAlunoScreen() {
  const { cadastrar } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'CadastroAluno'>>();
  const { consentimentoAceito, versaoConsentimento } = useRoute<Rota>().params;

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [outraModalidade, setOutraModalidade] = useState('');
  const [faixaOuGrau, setFaixaOuGrau] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [contatoResponsavel, setContatoResponsavel] = useState('');

  const [erros, setErros] = useState<Erros>({});
  const [erroConta, setErroConta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const nascimento = parseDataBr(dataNascimento);
  const ehMenorDeIdade = nascimento !== null && calcularIdade(nascimento) < IDADE_MINIMA_SEM_RESPONSAVEL;

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
    if (!faixaOuGrau.trim()) novosErros.faixaOuGrau = 'Informe sua faixa ou grau atual.';
    if (!dataNascimento.trim()) novosErros.dataNascimento = 'Informe sua data de nascimento.';
    else if (!nascimento) novosErros.dataNascimento = 'Data inválida. Use o formato DD/MM/AAAA.';

    // RF30: responsável legal é obrigatório quando o aluno é menor de 18 anos
    if (ehMenorDeIdade) {
      if (!nomeResponsavel.trim()) novosErros.nomeResponsavel = 'Informe o nome do responsável legal.';
      if (!contatoResponsavel.trim()) novosErros.contatoResponsavel = 'Informe um contato do responsável legal.';
    }

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
        perfil: 'aluno',
        modalidades: resolverModalidades(modalidades, outraModalidade, MODALIDADE_OUTRA),
        faixaOuGrau: faixaOuGrau.trim(),
        dataNascimento: paraTimestamp(nascimento!),
        ...(ehMenorDeIdade
          ? { responsavelLegal: { nome: nomeResponsavel.trim(), contato: contatoResponsavel.trim() } }
          : {}),
      });
      // RF28: registro de consentimento só é possível aqui — é o primeiro momento do fluxo em
      // que existe um uid autenticado (ver ConsentimentoLGPDScreen.tsx). Falha aqui não desfaz
      // a conta já criada; só fica sem o registro de auditoria — risco aceito nesta rodada.
      try {
        await criarConsentimento({
          usuarioId: novoUsuario.id,
          versao: versaoConsentimento,
          aceito: consentimentoAceito,
        });
      } catch {
        // Silencioso de propósito: a conta já existe, não há como voltar o fluxo pro
        // consentimento sem duplicar o cadastro.
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
        <Botao titulo="‹ Voltar" variante="texto" onPress={() => navigation.goBack()} />

        <Text style={styles.titulo}>Cadastro</Text>
        <Text style={styles.subtitulo}>Aluno</Text>

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
          rotulo="Modalidade(s) praticada(s)"
          selecionadas={modalidades}
          outraTexto={outraModalidade}
          onAlterarSelecionadas={setModalidades}
          onAlterarOutraTexto={setOutraModalidade}
          erro={erros.modalidades}
        />

        <CampoTexto
          rotulo="Faixa ou grau atual"
          placeholder="Ex.: Faixa roxa, 2º grau"
          valor={faixaOuGrau}
          onAlterar={setFaixaOuGrau}
          erro={erros.faixaOuGrau}
        />

        <CampoTexto
          rotulo="Data de nascimento"
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
          valor={dataNascimento}
          onAlterar={setDataNascimento}
          erro={erros.dataNascimento}
        />

        {ehMenorDeIdade ? (
          <View style={styles.blocoResponsavel}>
            {/* RF30: obrigatório para menores de 18 anos — identificação do responsável legal */}
            <Text style={styles.rotuloBloco}>Responsável legal</Text>
            <Text style={styles.ajudaBloco}>Como você é menor de 18 anos, precisamos dos dados de um responsável.</Text>
            <CampoTexto
              rotulo="Nome do responsável"
              placeholder="Nome completo"
              valor={nomeResponsavel}
              onAlterar={setNomeResponsavel}
              erro={erros.nomeResponsavel}
            />
            <CampoTexto
              rotulo="Contato do responsável"
              placeholder="E-mail ou telefone"
              valor={contatoResponsavel}
              onAlterar={setContatoResponsavel}
              erro={erros.contatoResponsavel}
            />
          </View>
        ) : null}

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
  blocoResponsavel: { marginTop: Espacamento.minimo, marginBottom: Espacamento.padrao },
  rotuloBloco: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.texto },
  ajudaBloco: { fontSize: TamanhoFonte.xs, color: Cores.texto2, marginTop: Espacamento.minimo, marginBottom: Espacamento.medio },
  espaco: { height: Espacamento.pequeno },
  rodape: { flexDirection: 'row', justifyContent: 'center', gap: Espacamento.pequeno, marginTop: Espacamento.padrao },
  rodapeTexto: { color: Cores.texto2, fontSize: TamanhoFonte.sm },
});
