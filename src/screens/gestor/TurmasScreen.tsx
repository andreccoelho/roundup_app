// RF10: lista as turmas do responsável e permite criar uma nova
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { criarTurma, listarTurmasPorResponsavel } from '../../services/turmas';
import { NivelTurma, Turma } from '../../types';
import { GestorStackParamList } from '../../navigation/types';

const NIVEIS: NivelTurma[] = ['iniciante', 'intermediario', 'avancado'];

export default function TurmasScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<GestorStackParamList, 'Turmas'>>();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const [nome, setNome] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [nivel, setNivel] = useState<NivelTurma>('iniciante');
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    carregarTurmas();
  }, []);

  async function carregarTurmas() {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const lista = await listarTurmasPorResponsavel(usuario.id);
      setTurmas(lista);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleCriar() {
    if (!usuario || !nome.trim() || !modalidade.trim()) return;
    setCriando(true);
    setErro(null);
    try {
      await criarTurma({
        nome: nome.trim(),
        modalidade: modalidade.trim(),
        nivel,
        autorId: usuario.id,
        autorPerfil: usuario.perfil,
      });
      setNome('');
      setModalidade('');
      setNivel('iniciante');
      await carregarTurmas();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCriando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.secaoTitulo}>Nova turma</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome da turma"
        placeholderTextColor={Colors.cinzaClaro}
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Modalidade"
        placeholderTextColor={Colors.cinzaClaro}
        value={modalidade}
        onChangeText={setModalidade}
      />
      <View style={styles.linhaNiveis}>
        {NIVEIS.map(opcao => (
          <TouchableOpacity
            key={opcao}
            style={[styles.chip, nivel === opcao && styles.chipSelecionado]}
            onPress={() => setNivel(opcao)}
          >
            <Text style={[styles.chipTexto, nivel === opcao && styles.chipTextoSelecionado]}>{opcao}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.botaoPrimario, (!nome.trim() || !modalidade.trim() || criando) && styles.botaoDesabilitado]}
        disabled={!nome.trim() || !modalidade.trim() || criando}
        onPress={handleCriar}
      >
        <Text style={styles.textoBotaoPrimario}>{criando ? 'Criando...' : 'Criar turma'}</Text>
      </TouchableOpacity>

      {erro && <Text style={styles.erro}>{erro}</Text>}

      <Text style={styles.secaoTitulo}>Minhas turmas</Text>
      {carregando ? (
        <ActivityIndicator color={Colors.preto} />
      ) : turmas.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma turma criada ainda.</Text>
      ) : (
        turmas.map(turma => (
          <TouchableOpacity
            key={turma.id}
            style={styles.item}
            onPress={() => navigation.navigate('TurmaDetalhe', { turmaId: turma.id })}
          >
            <Text style={styles.itemNome}>{turma.nome}</Text>
            <Text style={styles.itemDetalhe}>{turma.modalidade} · {turma.nivel} · {turma.ativa ? 'ativa' : 'inativa'}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.branco },
  conteudo: { padding: 16 },
  secaoTitulo: { fontSize: 18, fontWeight: 'bold', color: Colors.preto, marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: Colors.cinzaBorda,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    color: Colors.preto,
  },
  linhaNiveis: { flexDirection: 'row', marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.cinzaBorda,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  chipSelecionado: { backgroundColor: Colors.preto, borderColor: Colors.preto },
  chipTexto: { color: Colors.preto, fontSize: 12 },
  chipTextoSelecionado: { color: Colors.branco },
  botaoPrimario: { backgroundColor: Colors.preto, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  botaoDesabilitado: { backgroundColor: Colors.cinzaClaro },
  textoBotaoPrimario: { color: Colors.branco, fontWeight: 'bold' },
  erro: { color: Colors.preto, marginTop: 8, fontWeight: 'bold' },
  vazio: { color: Colors.cinzaMedio },
  item: {
    borderWidth: 1,
    borderColor: Colors.cinzaBorda,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemNome: { fontSize: 16, fontWeight: 'bold', color: Colors.preto },
  itemDetalhe: { fontSize: 12, color: Colors.cinzaMedio, marginTop: 4 },
});
