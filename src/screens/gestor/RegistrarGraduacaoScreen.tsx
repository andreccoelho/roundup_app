// RF25, RN03: registro de graduação — sempre decisão humana explícita do responsável. O
// Dialogo de confirmação existe por isso: a tela nunca submete sozinha a partir de um cálculo
// de pontos, e a confirmação é o ponto onde a decisão humana fica explícita na interface.
// Histórico é imutável depois de criado (ver firestore.rules) — sem tela de edição.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { criarGraduacao } from '../../services/graduacoes';
import { AlunosStackParamList } from '../../navigation/GestorTabsCompartilhado';
import Botao from '../../components/ui/Botao';
import Dialogo from '../../components/ui/Dialogo';
import CelebracaoGraduacao from '../../components/ui/CelebracaoGraduacao';
import CampoTexto from '../../components/ui/CampoTexto';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import { mensagemErro } from '../../utils/mensagensErro';

type Rota = RouteProp<AlunosStackParamList, 'RegistrarGraduacao'>;

export default function RegistrarGraduacaoScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation();
  const { alunoId, nomeAluno } = useRoute<Rota>().params;

  const [modalidade, setModalidade] = useState('');
  const [grau, setGrau] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [graduacaoRegistrada, setGraduacaoRegistrada] = useState<{ grau: string; modalidade: string } | null>(null);

  function handlePedirConfirmacao() {
    setErro(null);
    if (!modalidade.trim() || !grau.trim()) {
      setErro('Preencha modalidade e grau.');
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
      setModalidade('');
      setGrau('');
      setObservacoes('');
    } catch (e: any) {
      setConfirmando(false);
      setErro(mensagemErro(e, 'Não foi possível registrar a graduação. Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela largura="formulario" teclado>
      <Texto variante="rotuloPlacar">Aluno</Texto>
      <Texto variante="titulo" style={styles.nome}>
        {nomeAluno}
      </Texto>

      {erro ? (
        <Texto variante="legenda" cor="perigo" style={styles.erro} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}

      <CampoTexto rotulo="Modalidade" valor={modalidade} onAlterar={setModalidade} placeholder="Ex.: Muay Thai" />
      <CampoTexto rotulo="Grau" valor={grau} onAlterar={setGrau} placeholder="Ex.: Faixa azul, 2º grau" />
      {grau.trim() ? (
        <View style={styles.previa} accessibilityLabel="Prévia do selo">
          <SeloFaixa faixaOuGrau={grau.trim()} />
        </View>
      ) : null}
      <CampoTexto
        rotulo="Observações (opcional)"
        valor={observacoes}
        onAlterar={setObservacoes}
        placeholder="Ex.: Graduado no exame de setembro"
        multiline
      />

      <Botao titulo="Registrar graduação" onPress={handlePedirConfirmacao} />

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
  nome: { marginBottom: Espacamento.grande },
  erro: { marginBottom: Espacamento.medio },
  previa: { marginTop: -Espacamento.pequeno, marginBottom: Espacamento.padrao },
});
