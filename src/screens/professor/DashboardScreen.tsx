// Painel do Professor — RF10 (turmas), RF12 (sessão do dia), RF13/RN02/RN08 (chamada = validação
// de check-in, adiantando RF22). Dado real: turmas do professor, matrícula ativa, sessão de hoje
// e status de check-in de cada aluno. Missões ativas e graduações pendentes NÃO entram nesta tela
// ainda — RF23/RF25 são Ciclo 3.
// Esta tela busca dados e reage a ações; a apresentação está em HojeProfessorVisao.tsx (a mesma
// usada pela Galeria, com dados fictícios).
import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardProfessorNavigationProp } from '../../navigation/ProfessorTabs';
import { listarTurmasDoProfessor } from '../../services/turmas';
import { listarMatriculasPorTurma } from '../../services/matriculas';
import { listarSessoesPorTurma } from '../../services/sessoes';
import { listarCheckInsPorSessao, validarCheckIn } from '../../services/checkins';
import { buscarUsuario } from '../../services/usuarios';
import { CheckIn, Sessao, Turma } from '../../types';
import { paraData } from '../../utils/datas';
import { mensagemErro } from '../../utils/mensagensErro';
import Tela from '../../components/ui/Tela';
import HojeProfessorVisao, { type ItemChamadaVisao } from './HojeProfessorVisao';

interface ItemChamada {
  alunoId: string;
  nome: string;
  fotoUrl?: string;
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

  const carregarTurmas = useCallback(() => {
    if (!usuario) return;
    setCarregandoTurmas(true);
    setErro(null);
    listarTurmasDoProfessor(usuario.id)
      .then((lista) => {
        setTurmas(lista);
        setTurmaSelecionadaId((atual) => atual ?? lista[0]?.id ?? null);
      })
      .catch((e) => setErro(mensagemErro(e, 'Não foi possível carregar suas turmas agora.')))
      .finally(() => setCarregandoTurmas(false));
  }, [usuario]);

  useEffect(() => {
    carregarTurmas();
  }, [carregarTurmas]);

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
            fotoUrl: aluno?.fotoUrl,
            checkIn: checkIns.find((c) => c.alunoId === matricula.alunoId) ?? null,
          };
        }),
      );

      setSessaoHoje(sessao);
      setChamada(listaChamada);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar a chamada agora.'));
    } finally {
      setCarregandoPainel(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (turmaSelecionadaId) carregarPainel(turmaSelecionadaId);
  }, [turmaSelecionadaId, carregarPainel]);

  async function handleTogglePresenca(alunoId: string) {
    const item = chamada.find((c) => c.alunoId === alunoId);
    if (!usuario || !item?.checkIn || processandoAlunoId) return;
    const novoStatus = item.checkIn.status === 'validado' ? 'pendente' : 'validado';
    setProcessandoAlunoId(item.alunoId);
    setErro(null);
    try {
      await validarCheckIn(item.checkIn.id, usuario.id, novoStatus);
      setChamada((prev) =>
        prev.map((c) => (c.alunoId === item.alunoId && c.checkIn ? { ...c, checkIn: { ...c.checkIn, status: novoStatus } } : c)),
      );
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível atualizar a presença. Tente novamente.'));
    } finally {
      setProcessandoAlunoId(null);
    }
  }

  const presentes = chamada.filter((c) => c.checkIn && c.checkIn.status !== 'rejeitado').length;
  const chamadaVisao: ItemChamadaVisao[] = chamada.map((c) => ({
    alunoId: c.alunoId,
    nome: c.nome,
    fotoUrl: c.fotoUrl,
    status: c.checkIn ? c.checkIn.status : 'aguardando',
  }));

  return (
    <Tela largura="lista" agrupada tituloGrande="Hoje">
      <HojeProfessorVisao
        nome={usuario?.nome ?? ''}
        fotoUrl={usuario?.fotoUrl}
        graduacao={usuario?.graduacao}
        modalidades={usuario?.modalidades ?? []}
        turmas={turmas.map((t) => ({ id: t.id, nome: t.nome }))}
        turmaSelecionadaId={turmaSelecionadaId}
        carregandoTurmas={carregandoTurmas}
        sessaoHoje={sessaoHoje ? { inicio: paraData(sessaoHoje.inicio), status: sessaoHoje.status } : null}
        carregandoPainel={carregandoPainel}
        chamada={chamadaVisao}
        presentes={presentes}
        processandoAlunoId={processandoAlunoId}
        erro={erro}
        onSelecionarTurma={setTurmaSelecionadaId}
        onTogglePresenca={handleTogglePresenca}
        onTentarNovamente={() => (turmas.length === 0 ? carregarTurmas() : turmaSelecionadaId && carregarPainel(turmaSelecionadaId))}
        onCriarTurma={() => navigation.navigate('Turmas')}
        onGerenciarTurmas={() => navigation.navigate('Turmas')}
      />
    </Tela>
  );
}
