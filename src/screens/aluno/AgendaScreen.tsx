// RF14, RF13, RNF01: próximas sessões do aluno, com check-in em até 3 toques a partir da
// tela inicial — por isso o botão de check-in fica direto no item da lista, sem tela intermediária.
// Os 3 estados de RN08 (disponível / fora da janela / já realizado) precisam ser legíveis de
// relance: cada um tem forma, ícone e texto próprios — nunca só uma mudança de cor.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { listarProximasSessoesDoAluno } from '../../services/sessoes';
import { realizarCheckIn, buscarCheckInDaSessao } from '../../services/checkins';
import { buscarTurma } from '../../services/turmas';
import { buscarUsuario } from '../../services/usuarios';
import { Sessao } from '../../types';
import { formatarDataHora } from '../../utils/datas';
import { estadoCheckIn, motivoJanelaFechada, EstadoCheckIn } from '../../utils/statusCheckIn';
import LinhaFina from '../../components/LinhaFina';
import CartaoSessao from '../../components/ui/CartaoSessao';

interface ItemAgenda {
  sessao: Sessao;
  nomeTurma: string;
  nomeProfessor: string;
  estado: EstadoCheckIn;
}

export default function AgendaScreen() {
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemAgenda[]>([]);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const sessoes = await listarProximasSessoesDoAluno(usuario.id);
      const comDados = await Promise.all(
        sessoes.map(async (sessao) => {
          const [turma, professor, checkIn] = await Promise.all([
            buscarTurma(sessao.turmaId),
            buscarUsuario(sessao.professorId),
            buscarCheckInDaSessao(sessao.id, usuario.id),
          ]);
          return {
            sessao,
            nomeTurma: turma?.nome ?? 'Turma',
            nomeProfessor: professor?.nome ?? 'Professor',
            estado: estadoCheckIn(sessao, checkIn !== null),
          };
        }),
      );
      setItens(comDados);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleCheckIn(sessaoId: string) {
    if (!usuario) return;
    setProcessandoId(sessaoId);
    setErro(null);
    try {
      await realizarCheckIn(sessaoId, usuario.id);
      setItens(prev => prev.map(item => (item.sessao.id === sessaoId ? { ...item, estado: 'realizado' } : item)));
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setProcessandoId(null);
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
      {itens.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma sessão futura nas suas turmas.</Text>
      ) : (
        itens.map(({ sessao, nomeTurma, nomeProfessor, estado }, i) => (
          <View key={sessao.id}>
            <CartaoSessao
              nomeTurma={nomeTurma}
              detalhe={`${formatarDataHora(sessao.inicio)} · Prof. ${nomeProfessor}`}
              estado={estado}
              carregando={processandoId === sessao.id}
              motivo={estado === 'foraDaJanela' ? motivoJanelaFechada(sessao) : undefined}
              onCheckIn={() => handleCheckIn(sessao.id)}
            />
            {i < itens.length - 1 && <LinhaFina />}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.branco },
  conteudo: { paddingHorizontal: 20, paddingVertical: 8 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.branco },
  erro: { color: Colors.alerta, fontWeight: '600', marginBottom: 12 },
  vazio: { color: Colors.cinzaMedio, paddingVertical: 16 },
});
