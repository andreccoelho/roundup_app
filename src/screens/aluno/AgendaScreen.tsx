// RF14, RF13, RNF01: próximas sessões do aluno, com check-in em até 3 toques a partir da
// tela inicial — por isso o botão de check-in fica direto no item da lista, sem tela intermediária
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { listarProximasSessoesDoAluno } from '../../services/sessoes';
import { realizarCheckIn, buscarCheckInDaSessao } from '../../services/checkins';
import { buscarTurma } from '../../services/turmas';
import { buscarUsuario } from '../../services/usuarios';
import { Sessao } from '../../types';
import { formatarDataHora } from '../../utils/datas';

interface ItemAgenda {
  sessao: Sessao;
  nomeTurma: string;
  nomeProfessor: string;
  jaFezCheckIn: boolean;
}

function statusJanela(sessao: Sessao): { habilitado: boolean; motivo?: string } {
  const agora = new Date();
  const inicio = sessao.janelaCheckInInicio.toDate();
  const fim = sessao.janelaCheckInFim.toDate();
  if (agora < inicio) return { habilitado: false, motivo: 'Check-in ainda não abriu' };
  if (agora > fim) return { habilitado: false, motivo: 'Check-in já encerrado' };
  return { habilitado: true };
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
            jaFezCheckIn: checkIn !== null,
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
      setItens(prev => prev.map(item => (item.sessao.id === sessaoId ? { ...item, jaFezCheckIn: true } : item)));
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
        itens.map(({ sessao, nomeTurma, nomeProfessor, jaFezCheckIn }) => {
          const janela = statusJanela(sessao);
          const desabilitado = jaFezCheckIn || !janela.habilitado || processandoId === sessao.id;
          return (
            <View key={sessao.id} style={styles.item}>
              <Text style={styles.itemNome}>{nomeTurma}</Text>
              <Text style={styles.itemDetalhe}>{formatarDataHora(sessao.inicio)} · Prof. {nomeProfessor}</Text>
              <TouchableOpacity
                style={[styles.botao, desabilitado && styles.botaoDesabilitado]}
                disabled={desabilitado}
                onPress={() => handleCheckIn(sessao.id)}
              >
                <Text style={styles.textoBotao}>
                  {jaFezCheckIn
                    ? 'Check-in feito'
                    : processandoId === sessao.id
                      ? 'Enviando...'
                      : janela.habilitado
                        ? 'Fazer check-in'
                        : janela.motivo}
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
  item: { borderWidth: 1, borderColor: Colors.cinzaBorda, borderRadius: 8, padding: 12, marginBottom: 8 },
  itemNome: { fontSize: 16, fontWeight: 'bold', color: Colors.preto },
  itemDetalhe: { fontSize: 12, color: Colors.cinzaMedio, marginTop: 2, marginBottom: 8 },
  botao: { backgroundColor: Colors.preto, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  botaoDesabilitado: { backgroundColor: Colors.cinzaClaro },
  textoBotao: { color: Colors.branco, fontWeight: 'bold', fontSize: 12 },
});
