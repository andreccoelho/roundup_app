// RF15: histórico de check-ins do aluno, em ordem decrescente de data.
// Não reaproveita CartaoSessao: aquele componente é orientado à ação (BotaoCheckIn, estado
// EstadoCheckIn 'disponivel'/'foraDaJanela'/'realizado'); aqui os registros já são passado,
// somente leitura, com o enum diferente StatusCheckIn 'pendente'/'validado'/'rejeitado' — forçar
// o componente errado esconderia esse status atrás de um rótulo que não é o dele.
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarHistoricoDoAluno } from '../../services/checkins';
import { buscarTurma } from '../../services/turmas';
import { CheckIn, StatusCheckIn } from '../../types';
import { formatarDataHora } from '../../utils/datas';
import Cartao from '../../components/ui/Cartao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

interface ItemHistorico {
  checkIn: CheckIn;
  nomeTurma: string;
}

const ROTULO_STATUS: Record<StatusCheckIn, string> = {
  pendente: 'Pendente',
  validado: 'Validado',
  rejeitado: 'Rejeitado',
};

const COR_STATUS: Record<StatusCheckIn, string> = {
  pendente: Cores.texto2,
  validado: Cores.sucesso,
  rejeitado: Cores.perigo,
};

export default function HistoricoScreen() {
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemHistorico[]>([]);

  const carregar = useCallback(async () => {
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
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <View style={styles.container}>
        <Esqueleto altura={64} repeticoes={5} />
      </View>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  if (itens.length === 0) {
    return (
      <View style={styles.container}>
        <EstadoVazio titulo="Nenhum check-in registrado ainda" descricao="Seus check-ins validados e pendentes aparecem aqui." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {itens.map(({ checkIn, nomeTurma }) => (
        <Cartao key={checkIn.id} style={styles.item}>
          <Text style={styles.itemNome}>{nomeTurma}</Text>
          <View style={styles.itemLinha}>
            <Text style={styles.itemDetalhe}>{formatarDataHora(checkIn.dataHora)}</Text>
            <Text style={[styles.itemStatus, { color: COR_STATUS[checkIn.status] }]}>{ROTULO_STATUS[checkIn.status]}</Text>
          </View>
        </Cartao>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
  item: { marginBottom: Espacamento.pequeno },
  itemNome: { fontSize: TamanhoFonte.md, fontWeight: '700', color: Cores.texto },
  itemLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Espacamento.minimo },
  itemDetalhe: { fontSize: TamanhoFonte.xs, color: Cores.texto2 },
  itemStatus: { fontSize: TamanhoFonte.xs, fontWeight: '600' },
});
