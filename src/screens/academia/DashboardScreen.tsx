// Painel da Academia — RF09. Dado real: turmas ativas (`turmas`), professores e alunos com
// vínculo aceito (`vinculos`, RF07/RF08), e a contagem de turmas de cada professor (cruzando as
// duas coleções já reais). Frequência geral NÃO entra nesta tela ainda — RF26, Ciclo 3, exige
// uma agregação de check-ins por período que ainda não existe.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { AcademiaStackParamList } from '../../navigation/AcademiaStack';
import { listarTurmasPorResponsavel } from '../../services/turmas';
import { listarVinculosAceitosDaAcademia } from '../../services/vinculos';
import { buscarUsuario } from '../../services/usuarios';
import LinhaFina from '../../components/LinhaFina';

interface ProfessorVinculado {
  id: string;
  nome: string;
  quantidadeTurmas: number;
}

export default function DashboardScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AcademiaStackParamList, 'Dashboard'>>();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmasAtivas, setTurmasAtivas] = useState(0);
  const [alunosVinculados, setAlunosVinculados] = useState(0);
  const [professores, setProfessores] = useState<ProfessorVinculado[]>([]);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [turmas, vinculosProfessores, vinculosAlunos] = await Promise.all([
        listarTurmasPorResponsavel(usuario.id),
        listarVinculosAceitosDaAcademia(usuario.id, 'professor'),
        listarVinculosAceitosDaAcademia(usuario.id, 'aluno'),
      ]);

      setTurmasAtivas(turmas.filter((t) => t.ativa).length);
      setAlunosVinculados(vinculosAlunos.length);

      const listaProfessores = await Promise.all(
        vinculosProfessores.map(async (vinculo) => {
          const professor = await buscarUsuario(vinculo.solicitanteId);
          const quantidadeTurmas = turmas.filter((t) => t.professorId === vinculo.solicitanteId).length;
          return { id: vinculo.solicitanteId, nome: professor?.nome ?? 'Professor', quantidadeTurmas };
        }),
      );
      setProfessores(listaProfessores);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={Colors.preto} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>{usuario?.nomeAcademia ?? 'Painel da Academia'}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.linkSair}>Sair</Text>
        </TouchableOpacity>
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <View style={styles.contadoresLinha}>
        <View style={styles.contadorItem}>
          <Text style={styles.contadorValor}>{turmasAtivas}</Text>
          <Text style={styles.contadorRotulo}>turmas ativas</Text>
        </View>
        <View style={styles.contadorItem}>
          <Text style={styles.contadorValor}>{professores.length}</Text>
          <Text style={styles.contadorRotulo}>professores vinculados</Text>
        </View>
        <View style={styles.contadorItem}>
          <Text style={styles.contadorValor}>{alunosVinculados}</Text>
          <Text style={styles.contadorRotulo}>alunos vinculados</Text>
        </View>
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Professores vinculados</Text>
        {professores.length === 0 ? (
          <Text style={styles.vazio}>Nenhum professor vinculado ainda.</Text>
        ) : (
          professores.map((professor, i) => (
            <View key={professor.id}>
              <View style={styles.linhaSimples}>
                <Text style={styles.itemNome}>{professor.nome}</Text>
                <Text style={styles.itemDetalhe}>{professor.quantidadeTurmas} turma(s)</Text>
              </View>
              {i < professores.length - 1 && <LinhaFina />}
            </View>
          ))
        )}
      </View>

      <View style={styles.rodape}>
        <TouchableOpacity onPress={() => navigation.navigate('SolicitacoesAcademia')}>
          <Text style={styles.linkRodape}>Solicitações pendentes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Turmas')}>
          <Text style={styles.linkRodape}>Gerenciar turmas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.branco },
  conteudo: { paddingBottom: 32, flexGrow: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.branco },

  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  titulo: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.preto, flexShrink: 1, marginRight: 12 },
  linkSair: { fontSize: FontSize.sm, color: Colors.cinzaMedio },
  erro: { color: Colors.alerta, fontSize: FontSize.sm, marginHorizontal: 20, marginBottom: 8 },

  contadoresLinha: { flexDirection: 'row', paddingHorizontal: 20, gap: 24, marginTop: 8 },
  contadorItem: { flex: 1 },
  contadorValor: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.preto },
  contadorRotulo: { fontSize: FontSize.xs, color: Colors.cinzaMedio, marginTop: 2 },

  secao: { paddingHorizontal: 20, marginTop: 24 },
  secaoTitulo: { fontSize: FontSize.md, fontWeight: '600', color: Colors.preto, marginBottom: 8 },
  vazio: { color: Colors.cinzaMedio, fontSize: FontSize.sm },

  linhaSimples: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  itemNome: { fontSize: FontSize.md, color: Colors.preto, fontWeight: '600' },
  itemDetalhe: { fontSize: FontSize.sm, color: Colors.cinzaMedio },

  rodape: { paddingHorizontal: 20, gap: 12, marginTop: 28, paddingTop: 16 },
  linkRodape: { color: Colors.cinzaMedio, fontSize: FontSize.sm },
});
