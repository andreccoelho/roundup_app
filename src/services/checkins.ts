// RF13, RF15, RN02, RN08: check-in único por aluno por sessão, dentro da janela de tempo
import {
  doc, getDoc, runTransaction,
  collection, query, where, orderBy, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { CheckIn, Sessao, Matricula } from '../types';
import { agoraTimestamp } from '../utils/datas';

const COLECAO = 'checkins';
const COLECAO_SESSOES = 'sessoes';
const COLECAO_MATRICULAS = 'matriculas';

// RF13, RN02, RN08: o ID `${sessaoId}_${alunoId}` garante RN02 por construção;
// a transação evita a corrida entre a checagem e a gravação
export async function realizarCheckIn(sessaoId: string, alunoId: string): Promise<CheckIn> {
  const checkInId = `${sessaoId}_${alunoId}`;
  const sessaoRef = doc(db, COLECAO_SESSOES, sessaoId);
  const checkInRef = doc(db, COLECAO, checkInId);

  return runTransaction(db, async (transacao) => {
    const sessaoSnap = await transacao.get(sessaoRef);
    if (!sessaoSnap.exists()) {
      throw new Error('Sessão não encontrada.');
    }
    const sessao = sessaoSnap.data() as Sessao;

    if (sessao.status === 'cancelada') {
      throw new Error('Esta sessão foi cancelada.');
    }

    const matriculaRef = doc(db, COLECAO_MATRICULAS, `${sessao.turmaId}_${alunoId}`);
    const matriculaSnap = await transacao.get(matriculaRef);
    if (!matriculaSnap.exists() || (matriculaSnap.data() as Matricula).status !== 'ativa') {
      throw new Error('Você não está matriculado nesta turma.');
    }

    const checkInSnap = await transacao.get(checkInRef);
    if (checkInSnap.exists()) {
      throw new Error('Você já fez check-in nesta sessão.');
    }

    const agora = new Date();
    if (agora < sessao.janelaCheckInInicio.toDate()) {
      throw new Error('O check-in ainda não abriu para esta sessão.');
    }
    if (agora > sessao.janelaCheckInFim.toDate()) {
      throw new Error('O check-in desta sessão já encerrou.');
    }

    const checkIn: CheckIn = {
      id: checkInId,
      sessaoId,
      turmaId: sessao.turmaId,
      alunoId,
      responsavelId: sessao.responsavelId,
      dataHora: agoraTimestamp(),
      status: 'pendente',
      pontos: 0,
    };
    transacao.set(checkInRef, checkIn);
    return checkIn;
  });
}

// usada pelo gestor
export async function listarCheckInsPorSessao(sessaoId: string): Promise<CheckIn[]> {
  const q = query(collection(db, COLECAO), where('sessaoId', '==', sessaoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as CheckIn);
}

// RF15
export async function listarHistoricoDoAluno(alunoId: string): Promise<CheckIn[]> {
  const q = query(
    collection(db, COLECAO),
    where('alunoId', '==', alunoId),
    orderBy('dataHora', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as CheckIn);
}

export async function buscarCheckInDaSessao(sessaoId: string, alunoId: string): Promise<CheckIn | null> {
  const snap = await getDoc(doc(db, COLECAO, `${sessaoId}_${alunoId}`));
  return snap.exists() ? (snap.data() as CheckIn) : null;
}
