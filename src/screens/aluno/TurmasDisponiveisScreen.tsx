// RF11: turmas dos responsáveis com quem o aluno tem vínculo ativo, com opção de matrícula
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { listarTurmasDisponiveisParaAluno, listarTurmasDoAluno } from '../../services/turmas';
import { matricularAluno } from '../../services/matriculas';
import { Turma } from '../../types';

export default function TurmasDisponiveisScreen() {
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [matriculadasIds, setMatriculadasIds] = useState<Set<string>>(new Set());
  const [matriculando, setMatriculando] = useState<string | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [disponiveis, matriculadas] = await Promise.all([
        listarTurmasDisponiveisParaAluno(usuario.id),
        listarTurmasDoAluno(usuario.id),
      ]);
      setTurmas(disponiveis);
      setMatriculadasIds(new Set(matriculadas.map(t => t.id)));
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleMatricular(turmaId: string) {
    if (!usuario) return;
    setMatriculando(turmaId);
    setErro(null);
    try {
      await matricularAluno(turmaId, usuario.id);
      setMatriculadasIds(prev => new Set(prev).add(turmaId));
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setMatriculando(null);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={Colors.preto} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {erro && <Text style={styles.erro}>{erro}</Text>}
      {turmas.length === 0 ? (
        <Text style={styles.vazio}>
          Nenhuma turma disponível. Você precisa ter vínculo ativo com uma academia ou professor.
        </Text>
      ) : (
        turmas.map((turma) => {
          const jaMatriculado = matriculadasIds.has(turma.id);
          return (
            <View key={turma.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemNome}>{turma.nome}</Text>
                <Text style={styles.itemDetalhe}>{turma.modalidade} · {turma.nivel}</Text>
              </View>
              <TouchableOpacity
                style={[styles.botao, (jaMatriculado || matriculando === turma.id) && styles.botaoDesabilitado]}
                disabled={jaMatriculado || matriculando === turma.id}
                onPress={() => handleMatricular(turma.id)}
              >
                <Text style={styles.textoBotao}>
                  {jaMatriculado ? 'Matriculado' : matriculando === turma.id ? 'Matriculando...' : 'Matricular'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.branco },
  conteudo: { padding: 16 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.branco },
  erro: { color: Colors.preto, fontWeight: 'bold', marginBottom: 12 },
  vazio: { color: Colors.cinzaMedio },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.cinzaBorda,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemNome: { fontSize: 16, fontWeight: 'bold', color: Colors.preto },
  itemDetalhe: { fontSize: 12, color: Colors.cinzaMedio, marginTop: 2 },
  botao: { backgroundColor: Colors.preto, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  botaoDesabilitado: { backgroundColor: Colors.cinzaClaro },
  textoBotao: { color: Colors.branco, fontWeight: 'bold', fontSize: 12 },
});
