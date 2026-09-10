// Painel do Professor — RF10 (turmas), RF12 (sessão do dia), RF13/RN02/RN08 (chamada = validação
// de check-in, adiantando RF22). Dado real: turmas do professor, matrícula ativa, sessão de hoje
// e status de check-in de cada aluno. Missões ativas e graduações pendentes NÃO entram nesta tela
// ainda — RF23/RF25 são Ciclo 3, coleções `missoes`/`graduacoes` hoje bloqueadas em
// firestore.rules.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { ProfessorStackParamList } from '../../navigation/ProfessorStack';
import { listarTurmasDoProfessor } from '../../services/turmas';
import { listarMatriculasPorTurma } from '../../services/matriculas';
import { listarSessoesPorTurma } from '../../services/sessoes';
import { listarCheckInsPorSessao, validarCheckIn } from '../../services/checkins';
import { buscarUsuario } from '../../services/usuarios';
import { CheckIn, Sessao, Turma } from '../../types';
import { formatarDataHora } from '../../utils/datas';
import LinhaFina from '../../components/LinhaFina';
import Botao from '../../components/ui/Botao';

interface ItemChamada {
  alunoId: string;
  nome: string;
  checkIn: CheckIn | null;
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Sem sessão "aberta" hoje, cai para a mais próxima do dia — cobre tanto a janela de check-in
// já aberta quanto uma sessão agendada mais tarde no mesmo dia.
function selecionarSessaoDeHoje(sessoes: Sessao[]): Sessao | null {
  const hoje = new Date();
  const doDia = sessoes.filter((s) => mesmoDia(s.inicio.toDate(), hoje));
  if (doDia.length === 0) return null;
  return (
    doDia.find((s) => s.status === 'aberta') ??
    doDia.sort((a, b) => a.inicio.toMillis() - b.inicio.toMillis())[0]
  );
}

export default function DashboardScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<ProfessorStackParamList, 'Dashboard'>>();

  const [carregandoTurmas, setCarregandoTurmas] = useState(true);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<string | null>(null);

  const [carregandoPainel, setCarregandoPainel] = useState(false);
  const [sessaoHoje, setSessaoHoje] = useState<Sessao | null>(null);
  const [chamada, setChamada] = useState<ItemChamada[]>([]);
  const [processandoAlunoId, setProcessandoAlunoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;
    setCarregandoTurmas(true);
    listarTurmasDoProfessor(usuario.id)
      .then((lista) => {
        setTurmas(lista);
        setTurmaSelecionadaId((atual) => atual ?? lista[0]?.id ?? null);
      })
      .catch((e: any) => setErro(e.message))
      .finally(() => setCarregandoTurmas(false));
  }, [usuario]);

  const carregarPainel = useCallback(async (turmaId: string) => {
    if (!usuario) return;
    setCarregandoPainel(true);
    setErro(null);
    try {
      const [matriculas, sessoes] = await Promise.all([
        listarMatriculasPorTurma(turmaId, usuario.id),
        listarSessoesPorTurma(turmaId, usuario.id),
      ]);
      const ativas = matriculas.filter((m) => m.status === 'ativa');
      const sessao = selecionarSessaoDeHoje(sessoes);
      const checkIns = sessao ? await listarCheckInsPorSessao(sessao.id, usuario.id) : [];

      const listaChamada = await Promise.all(
        ativas.map(async (matricula) => {
          const aluno = await buscarUsuario(matricula.alunoId);
          return {
            alunoId: matricula.alunoId,
            nome: aluno?.nome ?? 'Aluno',
            checkIn: checkIns.find((c) => c.alunoId === matricula.alunoId) ?? null,
          };
        }),
      );

      setSessaoHoje(sessao);
      setChamada(listaChamada);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregandoPainel(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (turmaSelecionadaId) carregarPainel(turmaSelecionadaId);
  }, [turmaSelecionadaId, carregarPainel]);

  async function handleTogglePresenca(item: ItemChamada) {
    if (!usuario || !item.checkIn) return;
    const novoStatus = item.checkIn.status === 'validado' ? 'pendente' : 'validado';
    setProcessandoAlunoId(item.alunoId);
    setErro(null);
    try {
      await validarCheckIn(item.checkIn.id, usuario.id, novoStatus);
      setChamada((prev) =>
        prev.map((c) => (c.alunoId === item.alunoId && c.checkIn ? { ...c, checkIn: { ...c.checkIn, status: novoStatus } } : c)),
      );
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setProcessandoAlunoId(null);
    }
  }

  const total = chamada.length;
  const presentes = chamada.filter((c) => c.checkIn && c.checkIn.status !== 'rejeitado').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Painel do Professor</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.linkSair}>Sair</Text>
        </TouchableOpacity>
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      {carregandoTurmas ? (
        <ActivityIndicator color={Colors.preto} style={styles.espacoTopo} />
      ) : turmas.length === 0 ? (
        <View style={styles.secao}>
          <Text style={styles.vazio}>Você ainda não tem turmas.</Text>
          <View style={styles.espacoPequeno} />
          <Botao titulo="Criar turma" onPress={() => navigation.navigate('Turmas')} />
        </View>
      ) : (
        <>
          {turmas.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsLinha} contentContainerStyle={styles.chipsConteudo}>
              {turmas.map((turma) => (
                <TouchableOpacity
                  key={turma.id}
                  style={[styles.chip, turmaSelecionadaId === turma.id && styles.chipAtivo]}
                  onPress={() => setTurmaSelecionadaId(turma.id)}
                >
                  <Text style={[styles.chipTexto, turmaSelecionadaId === turma.id && styles.chipTextoAtivo]}>{turma.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.secao}>
            <Text style={styles.turmaNome}>{turmas.find((t) => t.id === turmaSelecionadaId)?.nome}</Text>
            <Text style={styles.turmaDetalhe}>
              {sessaoHoje ? `Sessão de hoje · ${formatarDataHora(sessaoHoje.inicio)} · status: ${sessaoHoje.status}` : 'Nenhuma sessão hoje nesta turma.'}
            </Text>

            <View style={styles.contadoresLinha}>
              <View>
                <Text style={styles.contadorValor}>{presentes}/{total}</Text>
                <Text style={styles.contadorRotulo}>presentes / matriculados</Text>
              </View>
            </View>
          </View>

          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Chamada de hoje</Text>
            {carregandoPainel ? (
              <ActivityIndicator color={Colors.preto} style={styles.espacoTopo} />
            ) : !sessaoHoje ? (
              <Text style={styles.vazio}>Sem sessão hoje — nada para chamar.</Text>
            ) : chamada.length === 0 ? (
              <Text style={styles.vazio}>Nenhum aluno matriculado nesta turma.</Text>
            ) : (
              chamada.map((item, i) => (
                <View key={item.alunoId}>
                  <View style={styles.linhaChamada}>
                    <Text style={styles.itemNome}>{item.nome}</Text>
                    {!item.checkIn ? (
                      <Text style={styles.statusAguardando}>Aguardando check-in</Text>
                    ) : (
                      <TouchableOpacity
                        style={[styles.botaoPresenca, item.checkIn.status === 'validado' && styles.botaoPresencaAtivo]}
                        onPress={() => handleTogglePresenca(item)}
                        disabled={processandoAlunoId === item.alunoId}
                      >
                        <Text style={[styles.textoPresenca, item.checkIn.status === 'validado' && styles.textoPresencaAtivo]}>
                          {processandoAlunoId === item.alunoId ? '...' : item.checkIn.status === 'validado' ? 'Presente' : 'Confirmar'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {i < chamada.length - 1 && <LinhaFina />}
                </View>
              ))
            )}
          </View>
        </>
      )}

      <View style={styles.rodape}>
        <TouchableOpacity onPress={() => navigation.navigate('VincularProfessor')}>
          <Text style={styles.linkRodape}>Vincular-se a uma academia</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SolicitacoesProfessor')}>
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

  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  titulo: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.preto },
  linkSair: { fontSize: FontSize.sm, color: Colors.cinzaMedio },
  erro: { color: Colors.alerta, fontSize: FontSize.sm, marginHorizontal: 20, marginBottom: 8 },
  espacoTopo: { marginTop: 16 },
  espacoPequeno: { height: 12 },

  chipsLinha: { marginTop: 4, marginBottom: 4 },
  chipsConteudo: { paddingHorizontal: 20, gap: 8 },
  chip: { borderWidth: 1, borderColor: Colors.cinzaEscuro, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14 },
  chipAtivo: { backgroundColor: Colors.preto, borderColor: Colors.preto },
  chipTexto: { color: Colors.cinzaEscuro, fontSize: FontSize.sm },
  chipTextoAtivo: { color: Colors.branco, fontWeight: '600' },

  secao: { paddingHorizontal: 20, marginTop: 20 },
  secaoTitulo: { fontSize: FontSize.md, fontWeight: '600', color: Colors.preto, marginBottom: 4 },
  vazio: { color: Colors.cinzaMedio, fontSize: FontSize.sm },

  turmaNome: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.preto },
  turmaDetalhe: { fontSize: FontSize.sm, color: Colors.cinzaMedio, marginTop: 4 },
  contadoresLinha: { flexDirection: 'row', marginTop: 16 },
  contadorValor: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.preto },
  contadorRotulo: { fontSize: FontSize.xs, color: Colors.cinzaMedio, marginTop: 2 },

  linhaChamada: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  itemNome: { fontSize: FontSize.md, color: Colors.preto, fontWeight: '600' },
  statusAguardando: { fontSize: FontSize.xs, color: Colors.cinzaClaro },
  botaoPresenca: { borderWidth: 1, borderColor: Colors.cinzaEscuro, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14 },
  botaoPresencaAtivo: { backgroundColor: Colors.checkinValidado, borderColor: Colors.checkinValidado },
  textoPresenca: { fontSize: FontSize.sm, color: Colors.cinzaEscuro },
  textoPresencaAtivo: { color: Colors.branco, fontWeight: '600' },

  rodape: { paddingHorizontal: 20, gap: 12, marginTop: 28, paddingTop: 16 },
  linkRodape: { color: Colors.cinzaMedio, fontSize: FontSize.sm },
});
