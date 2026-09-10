// RF14, RF13, RNF01: próximas sessões do aluno, com check-in em até 3 toques a partir da
// tela inicial — por isso o botão de check-in fica direto no item da lista, sem tela intermediária.
// Os 3 estados de RN08 (disponível / fora da janela / já realizado) precisam ser legíveis de
// relance: cada um tem forma, ícone e texto próprios — nunca só uma mudança de cor.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { listarProximasSessoesDoAluno } from '../../services/sessoes';
import { realizarCheckIn, buscarCheckInDaSessao } from '../../services/checkins';
import { buscarTurma } from '../../services/turmas';
import { buscarUsuario } from '../../services/usuarios';
import { Sessao } from '../../types';
import { formatarDataHora } from '../../utils/datas';
import { estadoCheckIn, motivoJanelaFechada, EstadoCheckIn } from '../../utils/statusCheckIn';
import LinhaFina from '../../components/LinhaFina';
import { IconeLuva, IconeCadeado, IconeCheck } from '../../components/icones';

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
            <ItemSessao
              nomeTurma={nomeTurma}
              nomeProfessor={nomeProfessor}
              dataHora={formatarDataHora(sessao.inicio)}
              estado={estado}
              processando={processandoId === sessao.id}
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

function ItemSessao({
  nomeTurma,
  nomeProfessor,
  dataHora,
  estado,
  processando,
  motivo,
  onCheckIn,
}: {
  nomeTurma: string;
  nomeProfessor: string;
  dataHora: string;
  estado: EstadoCheckIn;
  processando: boolean;
  motivo?: string;
  onCheckIn: () => void;
}) {
  return (
    <View style={styles.item}>
      <View style={styles.itemTextos}>
        <Text style={styles.itemNome}>{nomeTurma}</Text>
        <Text style={styles.itemDetalhe}>{dataHora} · Prof. {nomeProfessor}</Text>
      </View>

      {estado === 'realizado' && (
        <View style={styles.selo}>
          <IconeCheck cor={Colors.checkinValidado} tamanho={18} />
          <Text style={styles.seloTexto}>Feito</Text>
        </View>
      )}

      {estado === 'foraDaJanela' && (
        <View style={styles.seloFechado}>
          <IconeCadeado cor={Colors.alerta} tamanho={16} />
          <Text style={styles.seloFechadoTexto}>{motivo}</Text>
        </View>
      )}

      {estado === 'disponivel' && (
        <TouchableOpacity style={styles.botao} onPress={onCheckIn} disabled={processando}>
          <IconeLuva cor={Colors.branco} tamanho={16} />
          <Text style={styles.textoBotao}>{processando ? 'Enviando...' : 'Check-in'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.branco },
  conteudo: { paddingHorizontal: 20, paddingVertical: 8 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.branco },
  erro: { color: Colors.alerta, fontWeight: '600', marginBottom: 12 },
  vazio: { color: Colors.cinzaMedio, paddingVertical: 16 },

  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  itemTextos: { flex: 1 },
  itemNome: { fontSize: FontSize.md, fontWeight: '600', color: Colors.preto },
  itemDetalhe: { fontSize: FontSize.xs, color: Colors.cinzaMedio, marginTop: 2 },

  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.preto,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textoBotao: { color: Colors.branco, fontWeight: '600', fontSize: FontSize.xs },

  selo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seloTexto: { color: Colors.checkinValidado, fontSize: FontSize.xs, fontWeight: '600' },

  seloFechado: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 120 },
  seloFechadoTexto: { color: Colors.alerta, fontSize: FontSize.xs, textAlign: 'right' },
});
