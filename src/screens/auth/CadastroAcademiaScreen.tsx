// RF01, RF04: cadastro do perfil Academia — nome do contato, e-mail, senha, nome da
// academia, endereço, modalidade(s) oferecida(s). `nome` (contato) e `nomeAcademia`
// (institucional) são campos distintos — ver types/index.ts.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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
    setErroConta(null);
    if (!validar()) return;
    setCarregando(true);
    try {
      await cadastrar(email.trim(), senha, {
        nome: nome.trim(),
        perfil: 'academia',
        nomeAcademia: nomeAcademia.trim(),
        endereco: endereco.trim(),
        modalidades: resolverModalidades(modalidades, outraModalidade, MODALIDADE_OUTRA),
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
        <Text style={styles.subtitulo}>Academia</Text>

        {erroConta ? <Text style={styles.erroConta}>{erroConta}</Text> : null}

        <CampoTexto rotulo="Nome do responsável" placeholder="Quem está cadastrando" valor={nome} onAlterar={setNome} erro={erros.nome} />
        <CampoTexto
          rotulo="E-mail"
          placeholder="contato@academia.com"
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
  espaco: { height: 8 },
  rodape: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 },
  rodapeTexto: { color: Colors.cinzaMedio, fontSize: FontSize.sm },
});
