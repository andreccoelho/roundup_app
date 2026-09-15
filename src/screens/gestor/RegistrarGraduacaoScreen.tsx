// RF25, RN03: registro de graduação — sempre decisão humana explícita do responsável. O
// Dialogo de confirmação existe por isso: a tela nunca submete sozinha a partir de um cálculo
// de pontos, e a confirmação é o ponto onde a decisão humana fica explícita na interface.
// Histórico é imutável depois de criado (ver firestore.rules) — sem tela de edição.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { criarGraduacao } from '../../services/graduacoes';
import { AlunosStackParamList } from '../../navigation/GestorTabsCompartilhado';
import Botao from '../../components/ui/Botao';
import Dialogo from '../../components/ui/Dialogo';
import CelebracaoGraduacao from '../../components/ui/CelebracaoGraduacao';

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
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.titulo}>Registrar graduação</Text>
        <Text style={styles.subtitulo}>{nomeAluno}</Text>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Text style={styles.rotuloCampo}>Modalidade</Text>
        <TextInput style={styles.input} value={modalidade} onChangeText={setModalidade} placeholder="Ex.: Jiu-Jitsu" />

        <Text style={styles.rotuloCampo}>Grau</Text>
        <TextInput style={styles.input} value={grau} onChangeText={setGrau} placeholder="Ex.: Faixa azul" />

        <Text style={styles.rotuloCampo}>Observações (opcional)</Text>
        <TextInput style={styles.input} value={observacoes} onChangeText={setObservacoes} placeholder="Ex.: Graduado no exame de setembro" />

        <View style={styles.espaco} />
        <Botao titulo="Registrar graduação" onPress={handlePedirConfirmacao} />
      </ScrollView>

      <Dialogo
        visivel={confirmando}
        titulo="Confirmar graduação"
        mensagem={`Registrar ${grau} em ${modalidade} para ${nomeAluno}? Depois de criado, este registro não pode ser editado nem apagado.`}
        tituloConfirmar="Confirmar"
        onConfirmar={handleConfirmar}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Cores.branco },
  conteudo: { padding: Espacamento.padrao, paddingBottom: Espacamento.enorme },
  titulo: { fontSize: TamanhoFonte.xl, fontWeight: '700', color: Cores.preto },
  subtitulo: { fontSize: TamanhoFonte.md, color: Cores.cinzaMedio, marginTop: Espacamento.minimo, marginBottom: Espacamento.grande },
  erro: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.medio },
  rotuloCampo: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginBottom: Espacamento.minimo, marginTop: Espacamento.medio },
  input: { borderBottomWidth: 1, borderBottomColor: Cores.cinzaBorda, paddingVertical: Espacamento.pequeno, fontSize: TamanhoFonte.md, color: Cores.preto },
  espaco: { height: Espacamento.padrao },
});
