// RF01, RF06, RF25: cadastro do perfil Aluno — nome, e-mail, senha, modalidade(s) praticada(s),
// graduação por modalidade (seletor, RF06). Persiste em Firebase Auth + `usuarios` (Firestore) via useAuth().cadastrar.
// Sem os 4 estados de carregando/vazio/erro de tela: formulário sem busca de dados no mount, só
// ação de envio (já representada pelo `carregando` do próprio Botao).
import { useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { criarEstilos, Espacamento, Raios } from '../../theme';
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
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import MensagemErro from '../../components/ui/MensagemErro';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import GraduacaoSelector from '../../components/ui/GraduacaoSelector';
import {
  ESCOLHA_VAZIA,
  EscolhaGraduacao,
  NAO_SE_APLICA,
  SEM_GRADUACAO,
  textoGraduacao,
} from '../../constants/graduacoes';

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
  const styles = useEstilos();
  const { cadastrar } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'CadastroAluno'>>();
  const { consentimentoAceito, versaoConsentimento } = useRoute<Rota>().params;

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [outraModalidade, setOutraModalidade] = useState('');
  const [graduacoes, setGraduacoes] = useState<Record<string, EscolhaGraduacao>>({});
  const [faixaOutra, setFaixaOutra] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [contatoResponsavel, setContatoResponsavel] = useState('');

  const [erros, setErros] = useState<Erros>({});
  const [erroConta, setErroConta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  // Modalidades da lista fixa que exigem escolha de graduação (a "Outra" tem campo de texto próprio).
  const modalidadesFixas = modalidades.filter((m) => m !== MODALIDADE_OUTRA);
  const outraSelecionada = modalidades.includes(MODALIDADE_OUTRA);

  // `faixaOuGrau` segue sendo um único texto: vale a primeira graduação real escolhida; sem
  // nenhuma, "Sem graduação" ou "Não se aplica".
  function faixaOuGrauFinal(): string {
    const textos = [
      ...modalidadesFixas.map((m) => textoGraduacao(m, graduacoes[m])),
      ...(outraSelecionada ? [faixaOutra.trim()] : []),
    ].filter(Boolean);
    return (
      textos.find((t) => t !== SEM_GRADUACAO && t !== NAO_SE_APLICA) ??
      textos.find((t) => t === SEM_GRADUACAO) ??
      textos[0] ??
      ''
    );
  }

  // RF06: mapa modalidade → graduação declarada (a "Outra" entra com o nome digitado).
  function graduacoesFinais(): Record<string, string> {
    const mapa: Record<string, string> = {};
    for (const m of modalidadesFixas) mapa[m] = textoGraduacao(m, graduacoes[m]);
    if (outraSelecionada && outraModalidade.trim()) mapa[outraModalidade.trim()] = faixaOutra.trim();
    return mapa;
  }

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
    const faltaGraduacao =
      modalidadesFixas.some((m) => !textoGraduacao(m, graduacoes[m])) || (outraSelecionada && !faixaOutra.trim());
    if (faltaGraduacao) novosErros.faixaOuGrau = 'Escolha a graduação de cada modalidade (ou "Sem graduação").';
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
    if (carregando) return;
    setErroConta(null);
    if (!validar()) return;
    setCarregando(true);
    try {
      const novoUsuario = await cadastrar(email.trim(), senha, {
        nome: nome.trim(),
        perfil: 'aluno',
        modalidades: resolverModalidades(modalidades, outraModalidade, MODALIDADE_OUTRA),
        faixaOuGrau: faixaOuGrauFinal(),
        graduacoes: graduacoesFinais(),
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
    <Tela largura="formulario" bordas={['topo', 'base']} teclado agrupada>
      <Botao variante="voltar" onPress={() => navigation.goBack()} />

      <Texto variante="caption" style={styles.etapa}>
        Cadastro de aluno
      </Texto>
      <Texto variante="largeTitle">Monte sua ficha</Texto>
      <Texto variante="body" cor="texto2" style={styles.subtitulo}>
        Seus dados de atleta aparecem no seu perfil e para o seu professor.
      </Texto>

      <MensagemErro mensagem={erroConta} />

      <CabecalhoSecao titulo="Conta" formulario semMargem />
      <CampoTexto rotulo="Nome" placeholder="Seu nome completo" autoComplete="name" valor={nome} onAlterar={setNome} erro={erros.nome} />
      <CampoTexto
        rotulo="E-mail"
        placeholder="seuemail@exemplo.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        valor={email}
        onAlterar={setEmail}
        erro={erros.email}
      />
      <CampoTexto
        rotulo="Senha"
        secureTextEntry
        autoComplete="new-password"
        valor={senha}
        onAlterar={setSenha}
        erro={erros.senha}
        ajuda={erros.senha ? undefined : `Ao menos ${TAMANHO_MINIMO_SENHA} caracteres.`}
      />
      <CampoTexto
        rotulo="Confirmar senha"
        secureTextEntry
        autoComplete="new-password"
        valor={confirmarSenha}
        onAlterar={setConfirmarSenha}
        erro={erros.confirmarSenha}
      />

      <CabecalhoSecao titulo="Ficha de atleta" formulario />
      <ModalitySelector
        rotulo="Modalidade(s) praticada(s)"
        selecionadas={modalidades}
        outraTexto={outraModalidade}
        onAlterarSelecionadas={setModalidades}
        onAlterarOutraTexto={setOutraModalidade}
        erro={erros.modalidades}
      />
      {modalidadesFixas.map((m) => (
        <GraduacaoSelector
          key={m}
          modalidade={m}
          escolha={graduacoes[m] ?? ESCOLHA_VAZIA}
          onAlterar={(e) => setGraduacoes((g) => ({ ...g, [m]: e }))}
        />
      ))}
      {outraSelecionada ? (
        <CampoTexto
          rotulo="Faixa ou grau atual (outra modalidade)"
          placeholder="Ex.: Faixa roxa, 2º grau"
          valor={faixaOutra}
          onAlterar={setFaixaOutra}
        />
      ) : null}
      {erros.faixaOuGrau ? (
        <Texto variante="subheadline" cor="perigo" accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.erroGraduacao}>
          {erros.faixaOuGrau}
        </Texto>
      ) : null}
      <CampoTexto rotulo="Data de nascimento" mascara="data" valor={dataNascimento} onAlterar={setDataNascimento} erro={erros.dataNascimento} />

      {ehMenorDeIdade ? (
        <View style={styles.blocoResponsavel}>
          <CabecalhoSecao titulo="Responsável legal" formulario semMargem />
          <Texto variante="subheadline" style={styles.ajudaBloco}>
            Como você é menor de 18 anos, precisamos dos dados de um responsável.
          </Texto>
          <CampoTexto
            rotulo="Nome do responsável"
            placeholder="Nome completo"
            valor={nomeResponsavel}
            onAlterar={setNomeResponsavel}
            erro={erros.nomeResponsavel}
          />
          <CampoTexto
            rotulo="Contato do responsável"
            placeholder="Telefone ou e-mail"
            valor={contatoResponsavel}
            onAlterar={setContatoResponsavel}
            erro={erros.contatoResponsavel}
          />
        </View>
      ) : null}

      <View style={styles.espaco} />
      <Botao titulo="Criar conta" onPress={handleCadastrar} carregando={carregando} />

      <View style={styles.rodape}>
        <Texto variante="subheadline">Já tem conta?</Texto>
        <Botao titulo="Entrar" variante="texto" onPress={() => navigation.navigate('Login')} />
      </View>
    </Tela>
  );
}

const useEstilos = criarEstilos((c) => ({
  etapa: { marginTop: Espacamento.grande, marginBottom: Espacamento.minimo },
  subtitulo: { marginTop: Espacamento.pequeno, marginBottom: Espacamento.grande },
  erroGraduacao: { marginBottom: Espacamento.padrao },
  blocoResponsavel: {
    marginTop: Espacamento.pequeno,
    marginBottom: Espacamento.padrao,
    padding: Espacamento.padrao,
    paddingBottom: Espacamento.pequeno,
    borderRadius: Raios.lista,
    borderCurve: 'continuous',
    backgroundColor: c.superficie,
  },
  ajudaBloco: { marginBottom: Espacamento.medio },
  espaco: { height: Espacamento.pequeno },
  rodape: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Espacamento.pequeno, marginTop: Espacamento.padrao },
}));
