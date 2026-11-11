// RF10, RF12, RN07: gestão de turma já criada — mudar o horário e excluir. "Excluir" é soft delete
// (a regra de `turmas` nega deleteDoc: matrículas, sessões, check-ins e pontos referenciam a turma e o
// histórico do aluno precisa continuar). A turma sai da lista de matrícula dos alunos e as sessões
// que ainda não aconteceram viram "canceladas"; reativar devolve a turma, sem recriar sessões.
// Só o responsável pela turma faz isto (firestore.rules: turmas.update).
import { writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';
import { Sessao, Turma } from '../types';
import { agoraTimestamp, paraData, paraTimestamp, reagendarHorario } from '../utils/datas';
import { MINUTOS_ABERTURA_CHECKIN_ANTES_DO_INICIO } from '../constants/regras';
import { listarSessoesPorTurma } from './sessoes';

const TAMANHO_LOTE = 400; // limite do Firestore é 500 operações por lote

// Sessões que ainda não começaram e não foram abertas/encerradas: as únicas que mudam junto com a turma.
async function sessoesFuturasAgendadas(turma: Turma): Promise<Sessao[]> {
  const agora = Date.now();
  const todas = await listarSessoesPorTurma(turma.id, turma.responsavelId);
  return todas.filter((s) => s.status === 'agendada' && paraData(s.inicio).getTime() > agora);
}

async function gravarEmLotes(operacoes: Array<(lote: ReturnType<typeof writeBatch>) => void>): Promise<void> {
  for (let i = 0; i < operacoes.length; i += TAMANHO_LOTE) {
    const lote = writeBatch(db);
    operacoes.slice(i, i + TAMANHO_LOTE).forEach((op) => op(lote));
    await lote.commit();
  }
}

// Muda o horário da turma e das sessões futuras ainda agendadas; as passadas, abertas e encerradas
// ficam como estão (já aconteceram ou estão acontecendo). Devolve quantas sessões foram ajustadas.
export async function alterarHorarioTurma(turma: Turma, horarioInicio: string, horarioFim: string): Promise<number> {
  if (!reagendarHorario(new Date(), horarioInicio, horarioFim)) {
    throw new Error('Informe os horários no formato HH:MM, com o término depois do início.');
  }
  const futuras = await sessoesFuturasAgendadas(turma);
  const agora = agoraTimestamp();

  await gravarEmLotes([
    (lote) => lote.update(doc(db, 'turmas', turma.id), { horarioInicio, horarioFim, atualizadoEm: agora }),
    ...futuras.map((sessao) => (lote: ReturnType<typeof writeBatch>) => {
      const novo = reagendarHorario(paraData(sessao.inicio), horarioInicio, horarioFim)!;
      lote.update(doc(db, 'sessoes', sessao.id), {
        inicio: paraTimestamp(novo.inicio),
        fim: paraTimestamp(novo.fim),
        janelaCheckInInicio: paraTimestamp(new Date(novo.inicio.getTime() - MINUTOS_ABERTURA_CHECKIN_ANTES_DO_INICIO * 60_000)),
        janelaCheckInFim: paraTimestamp(novo.fim),
        atualizadoEm: agora,
      });
    }),
  ]);
  return futuras.length;
}

// "Excluir" a turma: desativa e cancela as sessões futuras ainda agendadas. Devolve quantas foram canceladas.
export async function excluirTurma(turma: Turma): Promise<number> {
  const futuras = await sessoesFuturasAgendadas(turma);
  const agora = agoraTimestamp();
  await gravarEmLotes([
    (lote) => lote.update(doc(db, 'turmas', turma.id), { ativa: false, atualizadoEm: agora }),
    ...futuras.map((sessao) => (lote: ReturnType<typeof writeBatch>) =>
      lote.update(doc(db, 'sessoes', sessao.id), { status: 'cancelada', atualizadoEm: agora })),
  ]);
  return futuras.length;
}

export async function reativarTurma(turma: Turma): Promise<void> {
  await gravarEmLotes([(lote) => lote.update(doc(db, 'turmas', turma.id), { ativa: true, atualizadoEm: agoraTimestamp() })]);
}
