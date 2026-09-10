// RF13: janela de check-in calculada e lista de check-ins recebidos. Sem validação
// de check-in ainda — isso é RF22 no Ciclo 3.
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { buscarSessao, abrirSessao, encerrarSessao } from '../../services/sessoes';
import { listarCheckInsPorSessao } from '../../services/checkins';
import { buscarUsuario } from '../../services/usuarios';
import { CheckIn, Sessao } from '../../types';
import { formatarDataHora } from '../../utils/datas';
import { GestorStackParamList } from '../../navigation/types';

type SessaoDetalheRoute = RouteProp<GestorStackParamList, 'SessaoDetalhe'>;

interface CheckInComNome {
  checkIn: CheckIn;
  nomeAluno: string;
}

export default function SessaoDetalheScreen() {
  const { usuario } = useAuth();
  const route = useRoute<SessaoDetalheRoute>();
  const { sessaoId } = route.params;

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [checkIns, setCheckIns] = useState<CheckInComNome[]>([]);

  useEffect(() => {
    carregarTudo();
  }, [sessaoId]);

  async function carregarTudo() {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [sessaoEncontrada, listaCheckIns] = await Promise.all([
        buscarSessao(sessaoId),
        listarCheckInsPorSessao(sessaoId, usuario.id),
      ]);
      setSessao(sessaoEncontrada);
      const comNome = await Promise.all(
        listaCheckIns.map(async (checkIn) => {
          const aluno = await buscarUsuario(checkIn.alunoId);
          return { checkIn, nomeAluno: aluno?.nome ?? 'Aluno' };
        }),
      );
      setCheckIns(comNome);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleAbrir() {
    setProcessando(true);
    setErro(null);
    try {
      await abrirSessao(sessaoId);
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setProcessando(false);
    }
  }

  async function handleEncerrar() {
    setProcessando(true);
    setErro(null);
    try {
      await encerrarSessao(sessaoId);
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={Colors.preto} />
      </View>
    );
  }

  if (!sessao) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{erro ?? 'Sessão não encontrada.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.titulo}>{formatarDataHora(sessao.inicio)}</Text>
      <Text style={styles.subtitulo}>status: {sessao.status}</Text>
      <Text style={styles.subtitulo}>
        Janela de check-in: {formatarDataHora(sessao.janelaCheckInInicio)} até {formatarDataHora(sessao.janelaCheckInFim)}
      </Text>

      <View style={styles.linhaBotoes}>
        <TouchableOpacity
          style={[styles.botao, (processando || sessao.status !== 'agendada') && styles.botaoDesabilitado]}
          disabled={processando || sessao.status !== 'agendada'}
          onPress={handleAbrir}
        >
          <Text style={styles.textoBotao}>Abrir sessão</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botao, (processando || sessao.status !== 'aberta') && styles.botaoDesabilitado]}
          disabled={processando || sessao.status !== 'aberta'}
          onPress={handleEncerrar}
        >
          <Text style={styles.textoBotao}>Encerrar sessão</Text>
        </TouchableOpacity>
      </View>

      {erro && <Text style={styles.erro}>{erro}</Text>}

      <Text style={styles.secaoTitulo}>Check-ins recebidos</Text>
      {checkIns.length === 0 ? (
        <Text style={styles.vazio}>Nenhum check-in recebido ainda.</Text>
      ) : (
        checkIns.map(({ checkIn, nomeAluno }) => (
          <View key={checkIn.id} style={styles.item}>
            <Text style={styles.itemNome}>{nomeAluno}</Text>
            <Text style={styles.itemDetalhe}>{formatarDataHora(checkIn.dataHora)} · status: {checkIn.status}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.branco },
  conteudo: { padding: 16 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.branco, padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: Colors.preto },
  subtitulo: { fontSize: 13, color: Colors.cinzaMedio, marginTop: 4 },
  secaoTitulo: { fontSize: 18, fontWeight: 'bold', color: Colors.preto, marginTop: 20, marginBottom: 8 },
  linhaBotoes: { flexDirection: 'row', marginTop: 16 },
  botao: {
    flex: 1,
    backgroundColor: Colors.preto,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  botaoDesabilitado: { backgroundColor: Colors.cinzaClaro },
  textoBotao: { color: Colors.branco, fontWeight: 'bold' },
  erro: { color: Colors.preto, marginTop: 8, fontWeight: 'bold' },
  vazio: { color: Colors.cinzaMedio },
  item: { borderWidth: 1, borderColor: Colors.cinzaBorda, borderRadius: 8, padding: 12, marginBottom: 8 },
  itemNome: { fontSize: 16, fontWeight: 'bold', color: Colors.preto },
  itemDetalhe: { fontSize: 12, color: Colors.cinzaMedio, marginTop: 4 },
});
