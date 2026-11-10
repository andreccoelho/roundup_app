// RF25, RN03, RF06: registro de graduação — sempre decisão humana explícita do responsável. O
// Dialogo de confirmação existe por isso: a tela nunca submete sozinha a partir de um cálculo
// de pontos, e a confirmação é o ponto onde a decisão humana fica explícita na interface.
// Histórico é imutável depois de criado (ver firestore.rules) — sem tela de edição.
import { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { criarGraduacao } from '../../services/graduacoes';
import { AlunosStackParamList } from '../../navigation/GestorTabsCompartilhado';
import BotaoCabecalho from '../../components/ui/BotaoCabecalho';
import GrupoLista from '../../components/ui/GrupoLista';
import LinhaLista from '../../components/ui/LinhaLista';
import MensagemErro from '../../components/ui/MensagemErro';
import Dialogo from '../../components/ui/Dialogo';
import CelebracaoGraduacao from '../../components/ui/CelebracaoGraduacao';
import CampoTexto from '../../components/ui/CampoTexto';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import GraduacaoSelector from '../../components/ui/GraduacaoSelector';
import Etiqueta from '../../components/ui/Etiqueta';
import { MODALIDADES, MODALIDADE_OUTRA } from '../../constants/modalidades';
import { ESCOLHA_VAZIA, EscolhaGraduacao, SEM_GRADUACAO, modalidadeSemGraduacao, textoGraduacao } from '../../constants/graduacoes';
import { mensagemErro } from '../../utils/mensagensErro';

type Rota = RouteProp<AlunosStackParamList, 'RegistrarGraduacao'>;

export default function RegistrarGraduacaoScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation();
  const { alunoId, nomeAluno } = useRoute<Rota>().params;

  // Modalidade escolhida na lista (ou "Outra" + texto livre); a graduação vem do seletor da modalidade.
  const [escolhida, setEscolhida] = useState('');
  const [outraModalidade, setOutraModalidade] = useState('');
  const [escolha, setEscolha] = useState<EscolhaGraduacao>(ESCOLHA_VAZIA);
  const [grauOutra, setGrauOutra] = useState('');
  const ehOutra = escolhida === MODALIDADE_OUTRA;
  const modalidade = ehOutra ? outraModalidade : escolhida;
  const grau = ehOutra ? grauOutra : textoGraduacao(escolhida, escolha);
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [graduacaoRegistrada, setGraduacaoRegistrada] = useState<{ grau: string; modalidade: string } | null>(null);

  function handlePedirConfirmacao() {
    setErro(null);
    if (!modalidade.trim() || !grau.trim() || grau === SEM_GRADUACAO) {
      setErro('Escolha a modalidade e uma graduação.');
      return;
    }
    setConfirmando(true);
  }

  async function handleConfirmar() {
    if (!usuario) return;
    setSalvando(true);
    try {
      const grauConfirmado = grau.trim();
      const modalidadeConfirmada = modalidade.trim();
      await criarGraduacao({
        alunoId,
        responsavelId: usuario.id,
        modalidade: modalidadeConfirmada,
        grau: grauConfirmado,
        dataGraduacao: new Date(),
        ...(observacoes.trim() ? { observacoes: observacoes.trim() } : {}),
      });
      setConfirmando(false);
      setGraduacaoRegistrada({ grau: grauConfirmado, modalidade: modalidadeConfirmada });
      setEscolhida('');
      setOutraModalidade('');
      setEscolha(ESCOLHA_VAZIA);
      setGrauOutra('');
      setObservacoes('');
    } catch (e: any) {
      setConfirmando(false);
      setErro(mensagemErro(e, 'Não foi possível registrar a graduação. Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  }

  // Sheet do iOS: "Cancelar" à esquerda (opcoesFolha) e "Registrar" à direita
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <BotaoCabecalho titulo="Registrar" forte onPress={handlePedirConfirmacao} />,
    });
  });

  return (
    <Tela largura="formulario" agrupada teclado>
      <GrupoLista titulo="Aluno" semMargem>
        <LinhaLista rotulo={nomeAluno} />
      </GrupoLista>
      <View style={styles.espaco} />

      <MensagemErro mensagem={erro} />

      <Texto variante="subheadline" style={styles.rotuloModalidade} cabecalho={false}>
        Modalidade
      </Texto>
      <View style={styles.grade} role="radiogroup" aria-label="Modalidade">
        {[...MODALIDADES.filter((m) => !modalidadeSemGraduacao(m)), MODALIDADE_OUTRA].map((m) => (
          <Etiqueta
            key={m}
            texto={m}
            selecionada={escolhida === m}
            onPress={() => {
              setEscolhida(m);
              setEscolha(ESCOLHA_VAZIA);
            }}
          />
        ))}
      </View>
      {ehOutra ? (
        <>
          <CampoTexto rotulo="Qual modalidade?" valor={outraModalidade} onAlterar={setOutraModalidade} />
          <CampoTexto rotulo="Grau" valor={grauOutra} onAlterar={setGrauOutra} placeholder="Ex.: Faixa azul, 2º grau" />
        </>
      ) : escolhida ? (
        <GraduacaoSelector modalidade={escolhida} escolha={escolha} onAlterar={setEscolha} />
      ) : null}
      <CampoTexto
        rotulo="Observações (opcional)"
        valor={observacoes}
        onAlterar={setObservacoes}
        placeholder="Ex.: Graduado no exame de setembro"
        multiline
      />


      <Dialogo
        visivel={confirmando}
        titulo="Confirmar graduação"
        mensagem={`Registrar ${grau} em ${modalidade} para ${nomeAluno}? Depois de criado, este registro não pode ser editado nem apagado.`}
        tituloConfirmar="Confirmar"
        onConfirmar={handleConfirmar}
        carregando={salvando}
        tituloCancelar="Cancelar"
        onCancelar={() => setConfirmando(false)}
      />

      {graduacaoRegistrada ? (
        <CelebracaoGraduacao
          visivel
          nomeAluno={nomeAluno}
          grau={graduacaoRegistrada.grau}
          modalidade={graduacaoRegistrada.modalidade}
          onFechar={() => {
            setGraduacaoRegistrada(null);
            navigation.goBack();
          }}
        />
      ) : null}
    </Tela>
  );
}

const styles = StyleSheet.create({
  espaco: { height: Espacamento.grande },
  rotuloModalidade: { marginBottom: Espacamento.pequeno },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  previa: { marginTop: -Espacamento.pequeno, marginBottom: Espacamento.padrao },
});
