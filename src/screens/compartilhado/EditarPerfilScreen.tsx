// RF06: edição de perfil, compartilhada pelas 3 raízes — campos variam por usuario.perfil
// (graduacao só professor — a do aluno é só leitura, RN03: quem muda é o professor —, nomeAcademia/endereco só academia), mas
// modalidades e foto são comuns aos 3. Nunca edita perfil/email/id (ver AuthContext.atualizarPerfil).
//
// Foto: expo-image-picker (já era dependência instalada, nunca usada) + upload real para
// Firebase Storage (services/storage.ts). PENDÊNCIA SINALIZADA: storage.rules foi escrito nesta
// rodada mas só funciona depois de `firebase deploy --only storage` — até lá, o upload falha por
// permissão e a tela mostra um aviso fixo em vez do erro cru (mesmo padrão de RF29/ContaPrivacidadeScreen).
import { useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { enviarFotoPerfil } from '../../services/storage';
import { MODALIDADES, MODALIDADE_OUTRA } from '../../constants/modalidades';
import { resolverModalidades } from '../../utils/validacaoCadastro';
import Avatar from '../../components/ui/Avatar';
import CampoTexto from '../../components/ui/CampoTexto';
import ModalitySelector from '../../components/ui/ModalitySelector';
import Botao from '../../components/ui/Botao';
import BotaoCabecalho from '../../components/ui/BotaoCabecalho';
import Aviso from '../../components/ui/Aviso';
import Tela from '../../components/ui/Tela';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Texto from '../../components/ui/Texto';
import MensagemErro from '../../components/ui/MensagemErro';
import { mensagemErro } from '../../utils/mensagensErro';

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
    if (!usuario || salvando) return;
    setErro(null);
    setSalvando(true);
    try {
      const modalidadesFinal = resolverModalidades(modalidadesSelecionadas, outraModalidade, MODALIDADE_OUTRA);
      const dados: Parameters<typeof atualizarPerfil>[0] = {
        nome: nome.trim(),
        modalidades: modalidadesFinal,
      };
      if (usuario.perfil === 'professor') dados.graduacao = graduacao.trim();
      if (usuario.perfil === 'academia') {
        dados.nomeAcademia = nomeAcademia.trim();
        dados.endereco = endereco.trim();
      }

      await atualizarPerfil(dados);
      navigation.goBack();
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível salvar seu perfil. Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  }

  // Sheet do iOS: "Cancelar" à esquerda (opcoesFolha) e a ação de confirmar à direita
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <BotaoCabecalho titulo="Salvar" forte carregando={salvando} onPress={handleSalvar} />,
    });
  });

  if (!usuario) return null;

  return (
    <Tela
      largura="formulario"
      teclado
      agrupada
      sobreposicao={<Aviso mensagem={aviso ?? ''} visivel={aviso !== null} tipo="erro" onFechar={() => setAviso(null)} acimaDaTabBar />}
    >
      <View style={styles.fotoSecao}>
        <Pressable
          onPress={handleTrocarFoto}
          disabled={enviandoFoto}
          accessibilityRole="button"
          accessibilityLabel="Trocar foto de perfil"
          style={({ pressed }) => pressed && styles.pressionada}
        >
          <Avatar nome={nome || usuario.nome} fotoUrl={fotoUrl} tamanho={96} />
        </Pressable>
        <Botao titulo={enviandoFoto ? 'Enviando...' : 'Trocar foto'} variante="texto" onPress={handleTrocarFoto} desabilitado={enviandoFoto} />
      </View>

      <MensagemErro mensagem={erro} />

      <CampoTexto rotulo="Nome" valor={nome} onAlterar={setNome} autoComplete="name" />

      {usuario.perfil === 'aluno' ? (
        <View style={styles.graduacoesAluno}>
          <Texto variante="subheadline" cabecalho={false}>
            Graduação
          </Texto>
          {Object.entries(usuario.graduacoes ?? {}).map(([modalidade, grau]) => (
            <SeloFaixa key={modalidade} faixaOuGrau={`${modalidade}: ${grau}`} />
          ))}
          <Texto variante="footnote" cor="texto2">
            Quem atualiza a sua graduação é o seu professor ou a sua academia.
          </Texto>
        </View>
      ) : null}

      {usuario.perfil === 'professor' ? (
        <>
          <CampoTexto rotulo="Graduação" valor={graduacao} onAlterar={setGraduacao} placeholder="Ex.: Faixa preta, 3º grau" />
          {graduacao.trim() ? (
            <View style={styles.previa}>
              <SeloFaixa faixaOuGrau={graduacao.trim()} />
            </View>
          ) : null}
        </>
      ) : null}

      {usuario.perfil === 'academia' ? (
        <>
          <CampoTexto rotulo="Nome da academia" valor={nomeAcademia} onAlterar={setNomeAcademia} />
          <CampoTexto rotulo="Endereço" valor={endereco} onAlterar={setEndereco} autoComplete="street-address" />
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

    </Tela>
  );
}

const styles = StyleSheet.create({
  fotoSecao: { alignItems: 'center', gap: Espacamento.minimo, marginBottom: Espacamento.grande },
  pressionada: { opacity: 0.8 },
  graduacoesAluno: { gap: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  previa: { marginTop: -Espacamento.pequeno, marginBottom: Espacamento.padrao },
});
