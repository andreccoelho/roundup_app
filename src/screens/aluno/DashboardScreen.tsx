// Home do Aluno — RF14 (agenda + check-in inline). Dado real: faixa/grau e modalidades (de
// `usuarios`), próximas sessões e estado de check-in (de `sessoes`/`checkins`, mesma lógica de
// AgendaScreen/statusCheckIn). XP, sequência, missões e ranking NÃO entram nesta tela ainda —
// RF16/RF21 são Ciclo 2, RF18/RF23/RF20 dependem de `missoes`/`missoesProgresso`, hoje
// bloqueadas em firestore.rules.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { AlunoStackParamList } from '../../navigation/AlunoStack';
import { listarProximasSessoesDoAluno } from '../../services/sessoes';
import { realizarCheckIn, buscarCheckInDaSessao } from '../../services/checkins';
import { buscarTurma } from '../../services/turmas';
import { Sessao } from '../../types';
import { formatarDataHora } from '../../utils/datas';
import { estadoCheckIn, motivoJanelaFechada, EstadoCheckIn } from '../../utils/statusCheckIn';
import { IconeLuva, IconeCadeado, IconeCheck } from '../../components/icones';
import LinhaFina from '../../components/LinhaFina';
import Botao from '../../components/ui/Botao';

const MAXIMO_SESSOES_EXIBIDAS = 4;

interface ItemSessao {
  sessao: Sessao;
  nomeTurma: string;
  estado: EstadoCheckIn;
}

export default function DashboardScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AlunoStackParamList, 'Dashboard'>>();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemSessao[]>([]);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const sessoes = await listarProximasSessoesDoAluno(usuario.id);
      const comDados = await Promise.all(
        sessoes.slice(0, MAXIMO_SESSOES_EXIBIDAS).map(async (sessao) => {
          const [turma, checkIn] = await Promise.all([
            buscarTurma(sessao.turmaId),
            buscarCheckInDaSessao(sessao.id, usuario.id),
          ]);
          return {
            sessao,
            nomeTurma: turma?.nome ?? 'Turma',
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
    setEnviandoId(sessaoId);
    setErro(null);
    try {
      await realizarCheckIn(sessaoId, usuario.id);
      setItens((prev) => prev.map((item) => (item.sessao.id === sessaoId ? { ...item, estado: 'realizado' } : item)));
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setEnviandoId(null);
    }
  }

  const modalidades = usuario?.modalidades?.join(', ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.cabecalho}>
        <View>
          <Text style={styles.saudacao}>{usuario?.nome ?? ''}</Text>
          <Text style={styles.faixa}>
            {usuario?.faixaOuGrau ?? 'Faixa não informada'}
            {modalidades ? ` · ${modalidades}` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.linkSair}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.secao}>
        <View style={styles.secaoCabecalho}>
          <Text style={styles.secaoTitulo}>Próximos treinos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Agenda')}>
            <Text style={styles.linkVerMais}>ver agenda</Text>
          </TouchableOpacity>
        </View>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        {carregando ? (
          <ActivityIndicator color={Colors.preto} style={styles.carregandoLista} />
        ) : itens.length === 0 ? (
          <Text style={styles.vazio}>Nenhuma sessão agendada nas suas turmas.</Text>
        ) : (
          itens.map(({ sessao, nomeTurma, estado }, i) => (
            <View key={sessao.id}>
              <CardCheckIn
                nomeTurma={nomeTurma}
                dataHora={formatarDataHora(sessao.inicio)}
                estado={estado}
                enviando={enviandoId === sessao.id}
                onPressar={() => handleCheckIn(sessao.id)}
                motivo={estado === 'foraDaJanela' ? motivoJanelaFechada(sessao) : undefined}
              />
              {i < itens.length - 1 && <LinhaFina />}
            </View>
          ))
        )}
      </View>

      <View style={styles.rodape}>
        <TouchableOpacity onPress={() => navigation.navigate('TurmasDisponiveis')}>
          <Text style={styles.linkRodape}>Turmas disponíveis</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('VincularAluno')}>
          <Text style={styles.linkRodape}>Meus vínculos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Historico')}>
          <Text style={styles.linkRodape}>Histórico</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function CardCheckIn({
  nomeTurma,
  dataHora,
  estado,
  enviando,
  onPressar,
  motivo,
}: {
  nomeTurma: string;
  dataHora: string;
  estado: EstadoCheckIn;
  enviando: boolean;
  onPressar: () => void;
  motivo?: string;
}) {
  if (estado === 'realizado') {
    return (
      <View style={styles.linhaSessao}>
        <IconeCheck cor={Colors.checkinValidado} tamanho={20} />
        <View style={styles.linhaSessaoTextos}>
          <Text style={styles.itemTitulo}>{nomeTurma}</Text>
          <Text style={styles.itemDetalhe}>{dataHora}</Text>
        </View>
        <Text style={styles.seloRealizado}>Feito</Text>
      </View>
    );
  }

  if (estado === 'foraDaJanela') {
    return (
      <View style={styles.linhaSessao}>
        <IconeCadeado cor={Colors.alerta} tamanho={20} />
        <View style={styles.linhaSessaoTextos}>
          <Text style={styles.itemTitulo}>{nomeTurma}</Text>
          <Text style={styles.itemDetalhe}>{dataHora}</Text>
        </View>
        <Text style={styles.seloFechado}>{motivo}</Text>
      </View>
    );
  }

  return (
    <View style={styles.linhaSessao}>
      <IconeLuva cor={Colors.preto} tamanho={20} />
      <View style={styles.linhaSessaoTextos}>
        <Text style={styles.itemTitulo}>{nomeTurma}</Text>
        <Text style={styles.itemDetalhe}>{dataHora}</Text>
      </View>
      <View style={styles.botaoCheckIn}>
        <Botao titulo={enviando ? 'Enviando...' : 'Check-in'} onPress={onPressar} carregando={enviando} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.branco },
  conteudo: { paddingBottom: 32, flexGrow: 1 },

  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  saudacao: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.preto },
  faixa: { fontSize: FontSize.sm, color: Colors.cinzaMedio, marginTop: 4 },
  linkSair: { fontSize: FontSize.sm, color: Colors.cinzaMedio },

  secao: { paddingHorizontal: 20, marginTop: 20 },
  secaoCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secaoTitulo: { fontSize: FontSize.md, fontWeight: '600', color: Colors.preto },
  linkVerMais: { fontSize: FontSize.sm, color: Colors.cinzaMedio },
  carregandoLista: { marginTop: 12 },
  vazio: { color: Colors.cinzaMedio, fontSize: FontSize.sm, marginTop: 12 },
  erro: { color: Colors.alerta, fontSize: FontSize.sm, marginTop: 8 },

  linhaSessao: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  linhaSessaoTextos: { flex: 1 },
  itemTitulo: { fontSize: FontSize.md, fontWeight: '600', color: Colors.preto },
  itemDetalhe: { fontSize: FontSize.xs, color: Colors.cinzaMedio, marginTop: 2 },
  botaoCheckIn: { minWidth: 110 },
  seloRealizado: { color: Colors.checkinValidado, fontSize: FontSize.xs, fontWeight: '600' },
  seloFechado: { color: Colors.alerta, fontSize: FontSize.xs, maxWidth: 110, textAlign: 'right' },

  rodape: { paddingHorizontal: 20, gap: 12, marginTop: 28, paddingTop: 16 },
  linkRodape: { color: Colors.cinzaMedio, fontSize: FontSize.sm },
});
