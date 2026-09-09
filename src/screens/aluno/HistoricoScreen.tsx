// RF15: histórico de check-ins do aluno, em ordem decrescente de data
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { listarHistoricoDoAluno } from '../../services/checkins';
import { buscarTurma } from '../../services/turmas';
import { CheckIn } from '../../types';
import { formatarDataHora } from '../../utils/datas';

interface ItemHistorico {
  checkIn: CheckIn;
  nomeTurma: string;
}

export default function HistoricoScreen() {
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemHistorico[]>([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const checkIns = await listarHistoricoDoAluno(usuario.id);
      const comNomeTurma = await Promise.all(
        checkIns.map(async (checkIn) => {
          const turma = await buscarTurma(checkIn.turmaId);
          return { checkIn, nomeTurma: turma?.nome ?? 'Turma' };
        }),
      );
      setItens(comNomeTurma);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={Colors.preto} />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{erro}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {itens.length === 0 ? (
        <Text style={styles.vazio}>Nenhum check-in registrado ainda.</Text>
      ) : (
        itens.map(({ checkIn, nomeTurma }) => (
          <View key={checkIn.id} style={styles.item}>
            <Text style={styles.itemNome}>{nomeTurma}</Text>
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
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.branco },
  erro: { color: Colors.preto, fontWeight: 'bold' },
  vazio: { color: Colors.cinzaMedio },
  item: { borderWidth: 1, borderColor: Colors.cinzaBorda, borderRadius: 8, padding: 12, marginBottom: 8 },
  itemNome: { fontSize: 16, fontWeight: 'bold', color: Colors.preto },
  itemDetalhe: { fontSize: 12, color: Colors.cinzaMedio, marginTop: 4 },
});
