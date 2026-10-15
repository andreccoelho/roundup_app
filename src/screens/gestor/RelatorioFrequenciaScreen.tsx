// RF26: relatório de frequência por turma e período — período em texto DD/MM/AAAA, mesmo
// padrão de TurmaDetalheScreen.tsx (sem date picker nesta rodada).
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { relatorioFrequenciaPorTurma, LinhaRelatorioFrequencia } from '../../services/frequencia';
import { parseDataBr } from '../../utils/datas';
import { GestorStackParamList } from '../../navigation/types';
import Botao from '../../components/ui/Botao';
import LinhaFina from '../../components/LinhaFina';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

type Rota = RouteProp<GestorStackParamList, 'RelatorioFrequencia'>;

export default function RelatorioFrequenciaScreen() {
  const { usuario } = useAuth();
  const { turmaId } = useRoute<Rota>().params;

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [gerado, setGerado] = useState(false);
  const [linhas, setLinhas] = useState<LinhaRelatorioFrequencia[]>([]);

  async function handleGerar() {
    if (!usuario) return;
    const inicio = parseDataBr(dataInicio);
    const fim = parseDataBr(dataFim);
    if (!inicio || !fim) {
      setErro('Preencha as duas datas no formato DD/MM/AAAA.');
      return;
    }
    if (fim.getTime() < inicio.getTime()) {
      setErro('A data final deve ser depois da inicial.');
      return;
    }

    setErro(null);
    setCarregando(true);
    try {
      const fimDoDia = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate(), 23, 59, 59);
      const resultado = await relatorioFrequenciaPorTurma(turmaId, usuario.id, inicio, fimDoDia);
      setLinhas(resultado);
      setGerado(true);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.rotuloCampo}>Data inicial</Text>
      <TextInput style={styles.input} value={dataInicio} onChangeText={setDataInicio} placeholder="DD/MM/AAAA" />

      <Text style={styles.rotuloCampo}>Data final</Text>
      <TextInput style={styles.input} value={dataFim} onChangeText={setDataFim} placeholder="DD/MM/AAAA" />

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <View style={styles.espaco} />
      <Botao titulo="Gerar relatório" onPress={handleGerar} carregando={carregando} />

      <View style={styles.espacoGrande} />

      {carregando ? (
        <Esqueleto altura={48} repeticoes={4} />
      ) : !gerado ? null : linhas.length === 0 ? (
        <EstadoVazio titulo="Nenhum aluno matriculado" descricao="Não há alunos ativos nesta turma para o período." />
      ) : (
        linhas.map((linha, i) => (
          <View key={linha.alunoId}>
            <View style={styles.linha}>
              <Text style={styles.nome}>{linha.nome}</Text>
              <Text style={styles.frequencia}>
                {linha.presencas} / {linha.totalSessoes} sessões
              </Text>
            </View>
            {i < linhas.length - 1 && <LinhaFina />}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { padding: Espacamento.padrao, paddingBottom: Espacamento.enorme },
  rotuloCampo: { fontSize: TamanhoFonte.sm, color: Cores.texto2, marginBottom: Espacamento.minimo, marginTop: Espacamento.medio },
  input: { borderBottomWidth: 1, borderBottomColor: Cores.linha, paddingVertical: Espacamento.pequeno, fontSize: TamanhoFonte.md, color: Cores.texto },
  erro: { color: Cores.perigo, fontSize: TamanhoFonte.sm, marginTop: Espacamento.medio },
  espaco: { height: Espacamento.padrao },
  espacoGrande: { height: Espacamento.grande },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Espacamento.medio },
  nome: { fontSize: TamanhoFonte.md, color: Cores.texto, fontWeight: '600' },
  frequencia: { fontSize: TamanhoFonte.sm, color: Cores.texto2 },
});
