// RF01, RF04: cadastro do perfil Academia — nome do contato, e-mail, senha, nome da
// academia, endereço, modalidade(s) oferecida(s). `nome` (contato) e `nomeAcademia`
// (institucional) são campos distintos — ver types/index.ts.
// Sem os 4 estados de carregando/vazio/erro de tela: formulário sem busca de dados no mount, só
// ação de envio (já representada pelo `carregando` do próprio Botao).
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Espacamento } from '../../theme';
import { MODALIDADE_OUTRA } from '../../constants/modalidades';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { criarConsentimento } from '../../services/consentimentosLGPD';
import { emailValido, senhaValida, resolverModalidades, TAMANHO_MINIMO_SENHA } from '../../utils/validacaoCadastro';
import { ehErroDeAutenticacao, mensagemErroAutenticacao, MENSAGEM_ERRO_PERSISTENCIA } from '../../utils/mensagensErro';
import CampoTexto from '../../components/ui/CampoTexto';
import Botao from '../../components/ui/Botao';
import ModalitySelector from '../../components/ui/ModalitySelector';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import MensagemErro from '../../components/ui/MensagemErro';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';

type Rota = RouteProp<AuthStackParamList, 'CadastroAcademia'>;

interface Erros {
  nome?: string;
  email?: string;
  senha?: string;
  confirmarSenha?: string;
  nomeAcademia?: string;
  endereco?: string;
  modalidades?: string;
}

export default function CadastroAcademiaScreen() {
  const { cadastrar } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'CadastroAcademia'>>();
  const { consentimentoAceito, versaoConsentimento } = useRoute<Rota>().params;

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [nomeAcademia, setNomeAcademia] = useState('');
  const [endereco, setEndereco] = useState('');
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [outraModalidade, setOutraModalidade] = useState('');

  const [erros, setErros] = useState<Erros>({});
  const [erroConta, setErroConta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  function validar(): boolean {
    const novosErros: Erros = {};
    if (!nome.trim()) novosErros.nome = 'Informe o nome do responsável.';
    if (!email.trim()) novosErros.email = 'Informe o e-mail.';
    else if (!emailValido(email)) novosErros.email = 'E-mail inválido.';
    if (!senhaValida(senha)) novosErros.senha = `Use ao menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
    if (confirmarSenha !== senha) novosErros.confirmarSenha = 'As senhas não coincidem.';
    if (!nomeAcademia.trim()) novosErros.nomeAcademia = 'Informe o nome da academia.';
    if (!endereco.trim()) novosErros.endereco = 'Informe o endereço.';
    if (resolverModalidades(modalidades, outraModalidade, MODALIDADE_OUTRA).length === 0) {
      novosErros.modalidades = 'Selecione ao menos uma modalidade.';
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
        perfil: 'academia',
        nomeAcademia: nomeAcademia.trim(),
        endereco: endereco.trim(),
        modalidades: resolverModalidades(modalidades, outraModalidade, MODALIDADE_OUTRA),
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
    <Tela largura="formulario" bordas={['topo', 'base']} teclado>
      <Botao variante="voltar" onPress={() => navigation.goBack()} />

      <Texto variante="rotuloPlacar" style={styles.etapa}>
        Cadastro de academia
      </Texto>
      <Texto variante="display">Abra seu ringue</Texto>
      <Texto variante="corpo" cor="texto2" style={styles.subtitulo}>
        Vincule professores e alunos e acompanhe as métricas da unidade.
      </Texto>

      <MensagemErro mensagem={erroConta} />

      <CabecalhoSecao titulo="Responsável" semMargem />
      <CampoTexto rotulo="Nome do responsável" placeholder="Quem está cadastrando" autoComplete="name" valor={nome} onAlterar={setNome} erro={erros.nome} />
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

      <CabecalhoSecao titulo="Academia" />
      <CampoTexto
        rotulo="Nome da academia"
        placeholder="Ex.: Academia Coração de Leão"
        valor={nomeAcademia}
        onAlterar={setNomeAcademia}
        erro={erros.nomeAcademia}
      />
      <CampoTexto
        rotulo="Endereço"
        placeholder="Rua, número, bairro, cidade"
        autoComplete="street-address"
        valor={endereco}
        onAlterar={setEndereco}
        erro={erros.endereco}
      />
      <ModalitySelector
        rotulo="Modalidade(s) oferecida(s)"
        selecionadas={modalidades}
        outraTexto={outraModalidade}
        onAlterarSelecionadas={setModalidades}
        onAlterarOutraTexto={setOutraModalidade}
        erro={erros.modalidades}
      />

      <View style={styles.espaco} />
      <Botao titulo="Criar conta" grande onPress={handleCadastrar} carregando={carregando} />

      <View style={styles.rodape}>
        <Texto variante="legenda">Já tem conta?</Texto>
        <Botao titulo="Entrar" variante="texto" onPress={() => navigation.navigate('Login')} />
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  etapa: { marginTop: Espacamento.grande, marginBottom: Espacamento.minimo },
  subtitulo: { marginTop: Espacamento.pequeno, marginBottom: Espacamento.grande },
  espaco: { height: Espacamento.pequeno },
  rodape: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Espacamento.pequeno, marginTop: Espacamento.padrao },
});
