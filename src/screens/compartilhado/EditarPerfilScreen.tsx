// RF06: edição de perfil, compartilhada pelas 3 raízes — campos variam por usuario.perfil
// (faixaOuGrau só aluno, graduacao só professor, nomeAcademia/endereco só academia), mas
// modalidades e foto são comuns aos 3. Nunca edita perfil/email/id (ver AuthContext.atualizarPerfil).
//
// Foto: expo-image-picker (já era dependência instalada, nunca usada) + upload real para
// Firebase Storage (services/storage.ts). PENDÊNCIA SINALIZADA: storage.rules foi escrito nesta
// rodada mas só funciona depois de `firebase deploy --only storage` — até lá, o upload falha por
// permissão e a tela mostra um aviso fixo em vez do erro cru (mesmo padrão de RF29/ExcluirContaSecao).
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { enviarFotoPerfil } from '../../services/storage';
import { MODALIDADES, MODALIDADE_OUTRA } from '../../constants/modalidades';
import { resolverModalidades } from '../../utils/validacaoCadastro';
import Avatar from '../../components/ui/Avatar';
import CampoTexto from '../../components/ui/CampoTexto';
import ModalitySelector from '../../components/ui/ModalitySelector';
import Botao from '../../components/ui/Botao';
import Aviso from '../../components/ui/Aviso';

const LISTA_FIXA: readonly string[] = MODALIDADES;

function inicializarModalidades(atuais: string[] | undefined): { selecionadas: string[]; outraTexto: string } {
  const lista = atuais ?? [];
  const doConjuntoFixo = lista.filter((m) => LISTA_FIXA.includes(m));
  const customizada = lista.find((m) => !LISTA_FIXA.includes(m));
  return {
    selecionadas: customizada ? [...doConjuntoFixo, MODALIDADE_OUTRA] : doConjuntoFixo,
    outraTexto: customizada ?? '',
  };
}

export default function EditarPerfilScreen() {
  const { usuario, atualizarPerfil } = useAuth();
  const navigation = useNavigation();

  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [faixaOuGrau, setFaixaOuGrau] = useState(usuario?.faixaOuGrau ?? '');
  const [graduacao, setGraduacao] = useState(usuario?.graduacao ?? '');
  const [nomeAcademia, setNomeAcademia] = useState(usuario?.nomeAcademia ?? '');
  const [endereco, setEndereco] = useState(usuario?.endereco ?? '');
  const [modalidadesSelecionadas, setModalidadesSelecionadas] = useState<string[]>([]);
  const [outraModalidade, setOutraModalidade] = useState('');
  const [fotoUrl, setFotoUrl] = useState(usuario?.fotoUrl);

  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const { selecionadas, outraTexto } = inicializarModalidades(usuario?.modalidades);
    setModalidadesSelecionadas(selecionadas);
    setOutraModalidade(outraTexto);
  }, [usuario]);

  async function handleTrocarFoto() {
    setErro(null);
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      setAviso('Permita o acesso às fotos para trocar sua imagem de perfil.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (resultado.canceled || !usuario) return;

    setEnviandoFoto(true);
    try {
      const url = await enviarFotoPerfil(usuario.id, resultado.assets[0].uri);
      setFotoUrl(url);
      await atualizarPerfil({ fotoUrl: url });
    } catch {
      // Ver nota de topo do arquivo — storage.rules ainda não foi implantado nesta rodada.
      setAviso('Não foi possível enviar a foto agora. Tente novamente mais tarde.');
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function handleSalvar() {
    if (!usuario) return;
    setErro(null);
    setSalvando(true);
    try {
      const modalidadesFinal = resolverModalidades(modalidadesSelecionadas, outraModalidade, MODALIDADE_OUTRA);
      const dados: Parameters<typeof atualizarPerfil>[0] = {
        nome: nome.trim(),
        modalidades: modalidadesFinal,
      };
      if (usuario.perfil === 'aluno') dados.faixaOuGrau = faixaOuGrau.trim();
      if (usuario.perfil === 'professor') dados.graduacao = graduacao.trim();
      if (usuario.perfil === 'academia') {
        dados.nomeAcademia = nomeAcademia.trim();
        dados.endereco = endereco.trim();
      }

      await atualizarPerfil(dados);
      navigation.goBack();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  if (!usuario) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.fotoSecao}>
        <TouchableOpacity
          onPress={handleTrocarFoto}
          disabled={enviandoFoto}
          accessibilityRole="button"
          accessibilityLabel="Trocar foto de perfil"
        >
          <Avatar nome={nome || usuario.nome} fotoUrl={fotoUrl} tamanho={88} />
        </TouchableOpacity>
        <Botao
          titulo={enviandoFoto ? 'Enviando...' : 'Trocar foto'}
          variante="texto"
          onPress={handleTrocarFoto}
          desabilitado={enviandoFoto}
        />
      </View>

      {erro ? (
        <Text style={styles.erro} accessibilityRole="alert">
          {erro}
        </Text>
      ) : null}

      <CampoTexto rotulo="Nome" valor={nome} onAlterar={setNome} />

      {usuario.perfil === 'aluno' ? (
        <CampoTexto rotulo="Faixa ou grau" valor={faixaOuGrau} onAlterar={setFaixaOuGrau} placeholder="Ex.: Faixa roxa, 2º grau" />
      ) : null}

      {usuario.perfil === 'professor' ? (
        <CampoTexto rotulo="Graduação" valor={graduacao} onAlterar={setGraduacao} placeholder="Ex.: Faixa preta, 3º grau" />
      ) : null}

      {usuario.perfil === 'academia' ? (
        <>
          <CampoTexto rotulo="Nome da academia" valor={nomeAcademia} onAlterar={setNomeAcademia} />
          <CampoTexto rotulo="Endereço" valor={endereco} onAlterar={setEndereco} />
        </>
      ) : null}

      <ModalitySelector
        rotulo={
          usuario.perfil === 'aluno' ? 'Modalidades praticadas' : usuario.perfil === 'professor' ? 'Modalidades lecionadas' : 'Modalidades oferecidas'
        }
        selecionadas={modalidadesSelecionadas}
        outraTexto={outraModalidade}
        onAlterarSelecionadas={setModalidadesSelecionadas}
        onAlterarOutraTexto={setOutraModalidade}
      />

      <Botao titulo="Salvar" onPress={handleSalvar} carregando={salvando} />

      <Aviso mensagem={aviso ?? ''} visivel={aviso !== null} tipo="erro" onFechar={() => setAviso(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco },
  conteudo: { padding: Espacamento.padrao, paddingBottom: Espacamento.enorme },
  fotoSecao: { alignItems: 'center', marginBottom: Espacamento.grande },
  erro: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.padrao },
});
