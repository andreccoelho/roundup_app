// Painel do Professor — RF10 (turmas), RF12 (sessão do dia), RF13/RN02/RN08 (chamada = validação
// de check-in, adiantando RF22). Dado real: turmas do professor, matrícula ativa, sessão de hoje
// e status de check-in de cada aluno. Missões ativas e graduações pendentes NÃO entram nesta tela
// ainda — RF23/RF25 são Ciclo 3, coleções `missoes`/`graduacoes` hoje bloqueadas em
// firestore.rules.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Cores, Espacamento, Raios, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardProfessorNavigationProp } from '../../navigation/ProfessorTabs';
import { listarTurmasDoProfessor } from '../../services/turmas';
import { listarMatriculasPorTurma } from '../../services/matriculas';
import { listarSessoesPorTurma } from '../../services/sessoes';
import { listarCheckInsPorSessao, validarCheckIn } from '../../services/checkins';
import { buscarUsuario } from '../../services/usuarios';
import { CheckIn, Sessao, Turma } from '../../types';
import { formatarDataHora } from '../../utils/datas';
import LinhaFina from '../../components/LinhaFina';
import Botao from '../../components/ui/Botao';
import Etiqueta from '../../components/ui/Etiqueta';

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
  const { usuario } = useAuth();
  const navigation = useNavigation<DashboardProfessorNavigationProp>();

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
      </View>

      {erro ? (
        <Text style={styles.erro} accessibilityRole="alert">
          {erro}
        </Text>
      ) : null}

      {carregandoTurmas ? (
        <ActivityIndicator color={Cores.preto} style={styles.espacoTopo} />
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
                <Etiqueta
                  key={turma.id}
                  texto={turma.nome}
                  selecionada={turmaSelecionadaId === turma.id}
                  onPress={() => setTurmaSelecionadaId(turma.id)}
                />
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
              <ActivityIndicator color={Cores.preto} style={styles.espacoTopo} />
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
                        accessibilityRole="button"
                        accessibilityLabel={`${item.checkIn.status === 'validado' ? 'Presente' : 'Confirmar presença'} de ${item.nome}`}
                        accessibilityState={{ selected: item.checkIn.status === 'validado', disabled: processandoAlunoId === item.alunoId }}
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
        <TouchableOpacity onPress={() => navigation.navigate('Turmas')}>
          <Text style={styles.linkRodape}>Gerenciar turmas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco },
  conteudo: { paddingBottom: Espacamento.extraGrande, flexGrow: 1 },

  cabecalho: {
    paddingHorizontal: Espacamento.grande,
    paddingTop: Espacamento.grande,
    paddingBottom: Espacamento.medio,
  },
  titulo: { fontSize: TamanhoFonte.lg, fontWeight: '600', color: Cores.preto },
  erro: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginHorizontal: Espacamento.grande, marginBottom: Espacamento.pequeno },
  espacoTopo: { marginTop: Espacamento.padrao },
  espacoPequeno: { height: Espacamento.medio },

  chipsLinha: { marginTop: Espacamento.minimo, marginBottom: Espacamento.minimo },
  chipsConteudo: { paddingHorizontal: Espacamento.grande, gap: Espacamento.pequeno },

  secao: { paddingHorizontal: Espacamento.grande, marginTop: Espacamento.grande },
  secaoTitulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.preto, marginBottom: Espacamento.minimo },
  vazio: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm },

  turmaNome: { fontSize: TamanhoFonte.xl, fontWeight: '700', color: Cores.preto },
  turmaDetalhe: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
  contadoresLinha: { flexDirection: 'row', marginTop: Espacamento.padrao },
  contadorValor: { fontSize: TamanhoFonte.xxl, fontWeight: '700', color: Cores.preto },
  contadorRotulo: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: 2 },

  linhaChamada: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Espacamento.medio },
  itemNome: { fontSize: TamanhoFonte.md, color: Cores.preto, fontWeight: '600' },
  // Cores.cinzaClaro corrigido na fonte (src/theme/tokens.ts) para 4,61:1 sobre branco — este
  // rótulo passou a valer 4,5:1 sem precisar de nenhuma mudança aqui além do import direto.
  statusAguardando: { fontSize: TamanhoFonte.xs, color: Cores.cinzaClaro },
  botaoPresenca: {
    borderWidth: 1,
    borderColor: Cores.cinzaEscuro,
    borderRadius: Raios.grande,
    paddingVertical: Espacamento.pequeno,
    paddingHorizontal: Espacamento.padrao,
    minHeight: 44,
    justifyContent: 'center',
  },
  botaoPresencaAtivo: { backgroundColor: Cores.checkinValidado, borderColor: Cores.checkinValidado },
  textoPresenca: { fontSize: TamanhoFonte.sm, color: Cores.cinzaEscuro },
  textoPresencaAtivo: { color: Cores.branco, fontWeight: '600' },

  rodape: { paddingHorizontal: Espacamento.grande, gap: Espacamento.medio, marginTop: Espacamento.grande + Espacamento.minimo, paddingTop: Espacamento.padrao },
  linkRodape: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm },
});
