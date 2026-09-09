// RF10, RF11, RF12: detalhe da turma — alunos matriculados, sessões e criação de sessão
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { buscarTurma } from '../../services/turmas';
import { listarMatriculasPorTurma } from '../../services/matriculas';
import { listarSessoesPorTurma, criarSessao } from '../../services/sessoes';
import { buscarUsuario } from '../../services/usuarios';
import { Matricula, Sessao, Turma } from '../../types';
import { formatarDataHora, parseDataHora } from '../../utils/datas';
import { GestorStackParamList } from '../../navigation/types';

type TurmaDetalheRoute = RouteProp<GestorStackParamList, 'TurmaDetalhe'>;

interface MatriculaComNome {
  matricula: Matricula;
  nomeAluno: string;
}

export default function TurmaDetalheScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<GestorStackParamList, 'TurmaDetalhe'>>();
  const route = useRoute<TurmaDetalheRoute>();
  const { turmaId } = route.params;

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [matriculas, setMatriculas] = useState<MatriculaComNome[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);

  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [descricao, setDescricao] = useState('');
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    carregarTudo();
  }, [turmaId]);

  async function carregarTudo() {
    setCarregando(true);
    setErro(null);
    try {
      const [turmaEncontrada, listaMatriculas, listaSessoes] = await Promise.all([
        buscarTurma(turmaId),
        listarMatriculasPorTurma(turmaId),
        listarSessoesPorTurma(turmaId),
      ]);
      setTurma(turmaEncontrada);
      setSessoes(listaSessoes.sort((a, b) => b.inicio.toMillis() - a.inicio.toMillis()));

      const comNome = await Promise.all(
        listaMatriculas
          .filter(m => m.status === 'ativa')
          .map(async (matricula) => {
            const aluno = await buscarUsuario(matricula.alunoId);
            return { matricula, nomeAluno: aluno?.nome ?? 'Aluno' };
          }),
      );
      setMatriculas(comNome);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleCriarSessao() {
    if (!usuario) return;
    const inicio = parseDataHora(data, horaInicio);
    const fim = parseDataHora(data, horaFim);
    if (!inicio || !fim) {
      setErro('Preencha a data (AAAA-MM-DD) e os horários (HH:MM) corretamente.');
      return;
    }

    setCriando(true);
    setErro(null);
    try {
      await criarSessao({
        turmaId,
        inicio,
        fim,
        descricao: descricao.trim() || undefined,
        autorId: usuario.id,
      });
      setData('');
      setHoraInicio('');
      setHoraFim('');
      setDescricao('');
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCriando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={Colors.preto} />
      </View>
    );
  }

  if (erro && !turma) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{erro}</Text>
      </View>
    );
  }

  if (!turma) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vazio}>Turma não encontrada.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.titulo}>{turma.nome}</Text>
      <Text style={styles.subtitulo}>{turma.modalidade} · {turma.nivel} · {turma.ativa ? 'ativa' : 'inativa'}</Text>

      <Text style={styles.secaoTitulo}>Alunos matriculados</Text>
      {matriculas.length === 0 ? (
        <Text style={styles.vazio}>Nenhum aluno matriculado ainda.</Text>
      ) : (
        matriculas.map(({ matricula, nomeAluno }) => (
          <View key={matricula.id} style={styles.itemSimples}>
            <Text style={styles.itemNome}>{nomeAluno}</Text>
          </View>
        ))
      )}

      <Text style={styles.secaoTitulo}>Nova sessão</Text>
      <TextInput
        style={styles.input}
        placeholder="Data (AAAA-MM-DD)"
        placeholderTextColor={Colors.cinzaClaro}
        value={data}
        onChangeText={setData}
      />
      <TextInput
        style={styles.input}
        placeholder="Início (HH:MM)"
        placeholderTextColor={Colors.cinzaClaro}
        value={horaInicio}
        onChangeText={setHoraInicio}
      />
      <TextInput
        style={styles.input}
        placeholder="Fim (HH:MM)"
        placeholderTextColor={Colors.cinzaClaro}
        value={horaFim}
        onChangeText={setHoraFim}
      />
      <TextInput
        style={styles.input}
        placeholder="Descrição (opcional)"
        placeholderTextColor={Colors.cinzaClaro}
        value={descricao}
        onChangeText={setDescricao}
      />
      <TouchableOpacity
        style={[styles.botaoPrimario, criando && styles.botaoDesabilitado]}
        disabled={criando}
        onPress={handleCriarSessao}
      >
        <Text style={styles.textoBotaoPrimario}>{criando ? 'Criando...' : 'Criar sessão'}</Text>
      </TouchableOpacity>

      {erro && <Text style={styles.erro}>{erro}</Text>}

      <Text style={styles.secaoTitulo}>Sessões</Text>
      {sessoes.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma sessão criada ainda.</Text>
      ) : (
        sessoes.map(sessao => (
          <TouchableOpacity
            key={sessao.id}
            style={styles.item}
            onPress={() => navigation.navigate('SessaoDetalhe', { sessaoId: sessao.id })}
          >
            <Text style={styles.itemNome}>{formatarDataHora(sessao.inicio)}</Text>
            <Text style={styles.itemDetalhe}>status: {sessao.status}</Text>
          </TouchableOpacity>
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
  input: {
    borderWidth: 1,
    borderColor: Colors.cinzaBorda,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    color: Colors.preto,
  },
  botaoPrimario: { backgroundColor: Colors.preto, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  botaoDesabilitado: { backgroundColor: Colors.cinzaClaro },
  textoBotaoPrimario: { color: Colors.branco, fontWeight: 'bold' },
  erro: { color: Colors.preto, marginTop: 8, fontWeight: 'bold' },
  vazio: { color: Colors.cinzaMedio },
  item: { borderWidth: 1, borderColor: Colors.cinzaBorda, borderRadius: 8, padding: 12, marginBottom: 8 },
  itemSimples: { borderWidth: 1, borderColor: Colors.cinzaBorda, borderRadius: 8, padding: 12, marginBottom: 8 },
  itemNome: { fontSize: 16, fontWeight: 'bold', color: Colors.preto },
  itemDetalhe: { fontSize: 12, color: Colors.cinzaMedio, marginTop: 4 },
});
