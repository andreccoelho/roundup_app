// RF24, RF26, RF27, RF32: agregações de frequência compostas a partir de coleções já
// desbloqueadas (turmas, matriculas, checkins) — sem coleção nem regra nova, ver
// docs/PLANO_REGRAS_CICLO2_3.md seção 0.
import { CheckIn } from '../types';
import { QUEDA_FREQUENCIA } from '../config/gamificacao';
import { listarTurmasPorResponsavel } from './turmas';
import { listarMatriculasPorTurma } from './matriculas';
import { listarSessoesPorTurma } from './sessoes';
import { listarCheckInsPorResponsavel } from './checkins';
import { buscarUsuario } from './usuarios';

export interface AlunoComFrequencia {
  alunoId: string;
  nome: string;
  faixaOuGrau?: string;
  frequenciaRecente: boolean[]; // últimos check-ins (até QUEDA_FREQUENCIA.janela), mais recente por último
  quedaFrequencia: boolean; // RF32 — ver critério provisório em src/config/gamificacao.ts
}

// RF24: alunos matriculados em qualquer turma do responsável, com frequência recente
export async function listarAlunosComFrequencia(responsavelId: string): Promise<AlunoComFrequencia[]> {
  const turmas = await listarTurmasPorResponsavel(responsavelId);
  const matriculasPorTurma = await Promise.all(
    turmas.map((turma) => listarMatriculasPorTurma(turma.id, responsavelId)),
  );

  const alunoIds = new Set<string>();
  matriculasPorTurma.flat().forEach((m) => {
    if (m.status === 'ativa') alunoIds.add(m.alunoId);
  });
  if (alunoIds.size === 0) return [];

  const checkins = await listarCheckInsPorResponsavel(responsavelId);
  const checkinsPorAluno = new Map<string, CheckIn[]>();
  checkins.forEach((c) => {
    const lista = checkinsPorAluno.get(c.alunoId) ?? [];
    lista.push(c);
    checkinsPorAluno.set(c.alunoId, lista);
  });

  return Promise.all(
    Array.from(alunoIds).map(async (alunoId) => {
      const usuario = await buscarUsuario(alunoId);
      const recentes = (checkinsPorAluno.get(alunoId) ?? [])
        .sort((a, b) => a.dataHora.toMillis() - b.dataHora.toMillis())
        .slice(-QUEDA_FREQUENCIA.janela);
      const frequenciaRecente = recentes.map((c) => c.status === 'validado');
      return {
        alunoId,
        nome: usuario?.nome ?? 'Aluno',
        faixaOuGrau: usuario?.faixaOuGrau,
        frequenciaRecente,
        quedaFrequencia: frequenciaRecente.filter(Boolean).length < QUEDA_FREQUENCIA.minimoPresencasJanela,
      };
    }),
  );
}

export interface LinhaRelatorioFrequencia {
  alunoId: string;
  nome: string;
  presencas: number;
  totalSessoes: number;
}

// RF26: presenças validadas por aluno matriculado, dentro de [inicio, fim], para uma turma.
// `totalSessoes` conta sessões AGENDADAS no período (via listarSessoesPorTurma), não só as que
// tiveram algum check-in — uma sessão sem ninguém presente ainda entra na contagem.
export async function relatorioFrequenciaPorTurma(
  turmaId: string,
  responsavelId: string,
  inicio: Date,
  fim: Date,
): Promise<LinhaRelatorioFrequencia[]> {
  const [matriculas, sessoes, checkins] = await Promise.all([
    listarMatriculasPorTurma(turmaId, responsavelId),
    listarSessoesPorTurma(turmaId, responsavelId),
    listarCheckInsPorResponsavel(responsavelId),
  ]);

  const sessoesNoPeriodo = sessoes.filter((s) => {
    const inicioSessao = s.inicio.toDate();
    return inicioSessao >= inicio && inicioSessao <= fim;
  });
  const sessaoIdsNoPeriodo = new Set(sessoesNoPeriodo.map((s) => s.id));

  const presencasPorAluno = new Map<string, number>();
  checkins
    .filter((c) => c.turmaId === turmaId && c.status === 'validado' && sessaoIdsNoPeriodo.has(c.sessaoId))
    .forEach((c) => presencasPorAluno.set(c.alunoId, (presencasPorAluno.get(c.alunoId) ?? 0) + 1));

  const ativos = matriculas.filter((m) => m.status === 'ativa');
  return Promise.all(
    ativos.map(async (m) => {
      const usuario = await buscarUsuario(m.alunoId);
      return {
        alunoId: m.alunoId,
        nome: usuario?.nome ?? 'Aluno',
        presencas: presencasPorAluno.get(m.alunoId) ?? 0,
        totalSessoes: sessoesNoPeriodo.length,
      };
    }),
  );
}
