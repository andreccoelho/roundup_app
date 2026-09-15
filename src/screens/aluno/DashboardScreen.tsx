// Home do Aluno — RF14 (agenda + check-in inline), RF17/RF21 (nível e sequência, tira de
// progresso abaixo do cabeçalho). Dado real: faixa/grau e modalidades (de `usuarios`),
// próximas sessões e estado de check-in (de `sessoes`/`checkins`, mesma lógica de
// AgendaScreen/statusCheckIn), pontos totais (`classificacoes`, somados entre todos os
// vínculos) e sequência (histórico de check-ins). Base de pontuação é PROVISÓRIA — ver
// docs/DECISOES_PENDENTES.md. Missões e ranking têm telas próprias (abas Missões/Classificação).
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Cores, Espacamento, FamiliaFonte, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardAlunoNavigationProp } from '../../navigation/AlunoTabs';
import { listarProximasSessoesDoAluno } from '../../services/sessoes';
import { realizarCheckIn, buscarCheckInDaSessao, listarHistoricoDoAluno } from '../../services/checkins';
import { buscarTurma } from '../../services/turmas';
import { listarClassificacoesDoAluno } from '../../services/classificacoes';
import { Sessao } from '../../types';
import { formatarDataHora } from '../../utils/datas';
import { estadoCheckIn, motivoJanelaFechada, EstadoCheckIn } from '../../utils/statusCheckIn';
import { calcularProgressoNivel, calcularSequencia, ProgressoNivel } from '../../utils/gamificacao';
import LinhaFina from '../../components/LinhaFina';
import CartaoSessao from '../../components/ui/CartaoSessao';
import BarraProgresso from '../../components/ui/BarraProgresso';
import IndicadorSequencia from '../../components/ui/IndicadorSequencia';
import Avatar from '../../components/ui/Avatar';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Etiqueta from '../../components/ui/Etiqueta';
import { IconeCorda } from '../../components/icones';

const MAXIMO_SESSOES_EXIBIDAS = 4;

interface ItemSessao {
  sessao: Sessao;
  nomeTurma: string;
  estado: EstadoCheckIn;
}

export default function DashboardScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<DashboardAlunoNavigationProp>();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemSessao[]>([]);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  const [progresso, setProgresso] = useState<ProgressoNivel | null>(null);
  const [sequencia, setSequencia] = useState(0);

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

  useEffect(() => {
    if (!usuario) return;
    // Tira de progresso é conteúdo secundário desta tela — falha aqui não deve bloquear o
    // check-in, que é a RNF01. Em erro, mostra nível 1 / sequência 0 em vez de estado de erro.
    Promise.all([listarClassificacoesDoAluno(usuario.id), listarHistoricoDoAluno(usuario.id)])
      .then(([classificacoes, historico]) => {
        const pontosTotais = classificacoes.reduce((soma, c) => soma + c.pontos, 0);
        setProgresso(calcularProgressoNivel(pontosTotais));
        setSequencia(calcularSequencia(historico));
      })
      .catch(() => {
        setProgresso(calcularProgressoNivel(0));
        setSequencia(0);
      });
  }, [usuario]);

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

  const modalidades = usuario?.modalidades ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {/* Banda full-bleed encosta no topo, igual à do LoginScreen — ícones da status bar claros. */}
      <StatusBar style="light" />
      {/* Banda full-bleed, não card — ficha de pesagem, não dashboard de SaaS (DESIGN_BRIEF.md). */}
      <View style={styles.cabecalho}>
        <View style={styles.motivoCorda} pointerEvents="none">
          <IconeCorda tamanho={64} cor={Cores.cinzaEscuro} espessura={1} />
        </View>
        <View style={styles.cabecalhoTopo}>
          <Avatar nome={usuario?.nome ?? ''} fotoUrl={usuario?.fotoUrl} tamanho={52} />
          <Text style={styles.saudacaoNome} numberOfLines={1} adjustsFontSizeToFit>
            {usuario?.nome ?? ''}
          </Text>
        </View>
        <View style={styles.seloLinha}>
          <SeloFaixa faixaOuGrau={usuario?.faixaOuGrau ?? 'Faixa não informada'} sobreEscuro />
        </View>
      </View>

      {modalidades.length > 0 ? (
        <View style={styles.modalidadesLinha}>
          {modalidades.map((modalidade) => (
            <Etiqueta key={modalidade} texto={modalidade} />
          ))}
        </View>
      ) : null}

      {progresso ? (
        <View style={styles.secaoProgresso}>
          <BarraProgresso nivel={progresso.nivel} xpAtual={progresso.xpAtual} xpProximoNivel={progresso.xpProximoNivel} />
          {sequencia > 0 ? (
            <View style={styles.sequenciaLinha}>
              <IndicadorSequencia dias={sequencia} />
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.secao}>
        <View style={styles.secaoCabecalho}>
          <Text style={styles.secaoTitulo}>Próximos treinos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Agenda')}>
            <Text style={styles.linkVerMais}>ver agenda</Text>
          </TouchableOpacity>
        </View>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        {carregando ? (
          <ActivityIndicator color={Cores.preto} style={styles.carregandoLista} />
        ) : itens.length === 0 ? (
          <Text style={styles.vazio}>Nenhuma sessão agendada nas suas turmas.</Text>
        ) : (
          itens.map(({ sessao, nomeTurma, estado }, i) => (
            <View key={sessao.id}>
              <CartaoSessao
                nomeTurma={nomeTurma}
                detalhe={formatarDataHora(sessao.inicio)}
                estado={estado}
                carregando={enviandoId === sessao.id}
                onCheckIn={() => handleCheckIn(sessao.id)}
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
        <TouchableOpacity onPress={() => navigation.navigate('Historico')}>
          <Text style={styles.linkRodape}>Histórico</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco },
  conteudo: { paddingBottom: Espacamento.extraGrande, flexGrow: 1 },

  // Banda full-bleed preta — hero de identidade do aluno, não um card branco a mais (anti-padrão
  // "kit de card de SaaS" do DESIGN_BRIEF.md). overflow hidden para a corda decorativa não
  // vazar do recorte.
  cabecalho: {
    backgroundColor: Cores.preto,
    paddingHorizontal: Espacamento.grande,
    paddingTop: Espacamento.extraGrande,
    paddingBottom: Espacamento.grande,
    overflow: 'hidden',
  },
  // Motivo assinatura (corda do ringue), usado uma única vez nesta tela — DESIGN_BRIEF.md.
  // Recorte no canto, bem apagado (cinzaEscuro sobre preto), textura e não decoração central.
  motivoCorda: { position: 'absolute', top: -8, right: -10, opacity: 0.6 },
  cabecalhoTopo: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio },
  saudacaoNome: {
    flex: 1,
    fontFamily: FamiliaFonte.homebaseDisplay,
    fontSize: TamanhoFonte.xxl,
    color: Cores.branco,
  },
  seloLinha: { marginTop: Espacamento.padrao },

  modalidadesLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.pequeno,
    paddingHorizontal: Espacamento.grande,
    paddingTop: Espacamento.padrao,
  },

  secaoProgresso: { paddingHorizontal: Espacamento.grande, marginTop: Espacamento.padrao },
  sequenciaLinha: { marginTop: Espacamento.medio },

  secao: { paddingHorizontal: Espacamento.grande, marginTop: Espacamento.grande },
  secaoCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secaoTitulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.preto },
  linkVerMais: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio },
  carregandoLista: { marginTop: Espacamento.medio },
  vazio: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm, marginTop: Espacamento.medio },
  erro: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginTop: Espacamento.pequeno },

  rodape: {
    paddingHorizontal: Espacamento.grande,
    gap: Espacamento.medio,
    marginTop: Espacamento.grande + Espacamento.minimo,
    paddingTop: Espacamento.padrao,
  },
  linkRodape: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm },
});
