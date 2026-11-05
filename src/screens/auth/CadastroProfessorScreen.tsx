// RF01, RF05: cadastro do perfil Professor — nome, e-mail, senha, modalidade(s) lecionada(s),
// graduação, indicação inicial de atuação autônoma ou vinculada (RN06: nasce autônomo por
// padrão; o vínculo de fato com uma academia é RF07, feito depois via VincularProfessorScreen).
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
import Abas from '../../components/ui/Abas';
import Texto from '../../components/ui/Texto';
import ModalitySelector from '../../components/ui/ModalitySelector';
import Tela from '../../components/ui/Tela';
import MensagemErro from '../../components/ui/MensagemErro';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import SeloFaixa from '../../components/ui/SeloFaixa';

type Rota = RouteProp<AuthStackParamList, 'CadastroProfessor'>;


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
    if (carregando) return;
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
    <Tela largura="formulario" bordas={['topo', 'base']} teclado agrupada>
      <Botao variante="voltar" onPress={() => navigation.goBack()} />

      <Texto variante="caption" style={styles.etapa}>
        Cadastro de professor
      </Texto>
      <Texto variante="largeTitle">Seu corner</Texto>
      <Texto variante="body" cor="texto2" style={styles.subtitulo}>
        Você vai controlar turmas, presença e graduação dos seus alunos.
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

      <CabecalhoSecao titulo="Ficha técnica" formulario />
      <ModalitySelector
        rotulo="Modalidade(s) lecionada(s)"
        selecionadas={modalidades}
        outraTexto={outraModalidade}
        onAlterarSelecionadas={setModalidades}
        onAlterarOutraTexto={setOutraModalidade}
        erro={erros.modalidades}
      />
      <CampoTexto
        rotulo="Graduação"
        placeholder="Ex.: Faixa preta, 3º grau"
        valor={graduacao}
        onAlterar={setGraduacao}
        erro={erros.graduacao}
      />
      {graduacao.trim() ? (
        <View style={styles.previa}>
          <SeloFaixa faixaOuGrau={graduacao.trim()} />
        </View>
      ) : null}

      <View style={styles.campoToggle}>
        <Texto variante="subheadline" style={styles.rotuloToggle}>
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
        <Texto variante="subheadline" cor="texto3" style={styles.ajudaToggle}>
          {autonomo
            ? 'Você mantém suas próprias turmas e alunos.'
            : 'Você poderá solicitar o vínculo com uma academia depois de entrar.'}
        </Texto>
      </View>

      <Botao titulo="Criar conta" onPress={handleCadastrar} carregando={carregando} />

      <View style={styles.rodape}>
        <Texto variante="subheadline">Já tem conta?</Texto>
        <Botao titulo="Entrar" variante="texto" onPress={() => navigation.navigate('Login')} />
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  etapa: { marginTop: Espacamento.grande, marginBottom: Espacamento.minimo },
  subtitulo: { marginTop: Espacamento.pequeno, marginBottom: Espacamento.grande },
  previa: { marginTop: -Espacamento.pequeno, marginBottom: Espacamento.padrao },
  campoToggle: { marginBottom: Espacamento.grande },
  rotuloToggle: { marginBottom: Espacamento.minimo },
  ajudaToggle: { marginTop: Espacamento.pequeno },
  rodape: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Espacamento.pequeno, marginTop: Espacamento.padrao },
});
