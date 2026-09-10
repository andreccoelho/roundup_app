// RF13, RF15, RN02, RN08: check-in único por aluno por sessão, dentro da janela de tempo
import {
  doc, updateDoc, runTransaction,
  collection, query, where, orderBy, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { CheckIn, Sessao, Matricula } from '../types';
import { agoraTimestamp } from '../utils/datas';
import { getDocSeguro } from './firestoreSeguro';

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

// Mesma classe de limitação documentada em listarMatriculasPorTurma/listarSessoesPorTurma:
// filtrar só por `sessaoId` é recusado pelas regras reais (a regra de `checkins` depende de
// `alunoId`/`responsavelId`, não de `sessaoId`). Filtra pelo campo que a regra verifica
// (`responsavelId`, já gravado em cada checkin) e reduz por sessaoId em memória — usada pelo
// responsável da sessão (gestor), nunca por um professor apenas atribuído (mesma limitação já
// existente para matrículas: só o responsavelId raiz da turma tem acesso).
export async function listarCheckInsPorSessao(sessaoId: string, responsavelId: string): Promise<CheckIn[]> {
  const q = query(collection(db, COLECAO), where('responsavelId', '==', responsavelId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as CheckIn).filter(c => c.sessaoId === sessaoId);
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

// getDocSeguro(), não getDoc() direto: ver decisão técnica em services/firestoreSeguro.ts — o
// caso comum aqui é exatamente "ainda não fiz check-in nesta sessão", que a regra nega como
// permission-denied em vez de simplesmente não existir.
export async function buscarCheckInDaSessao(sessaoId: string, alunoId: string): Promise<CheckIn | null> {
  return getDocSeguro<CheckIn>(doc(db, COLECAO, `${sessaoId}_${alunoId}`));
}

// RF22 (Ciclo 3, adiantado aqui para a chamada do professor): valida ou desfaz a validação de
// um check-in já existente. A regra (`resource.data.responsavelId == meuId()`) só permite
// UPDATE — o responsável não pode CRIAR um check-in em nome do aluno (create exige
// `souAluno() && alunoId == meuId()`). Por isso a "chamada" só alterna presença de quem já fez
// o próprio check-in; quem ainda não fez aparece como pendente, sem toggle.
export async function validarCheckIn(
  checkinId: string,
  responsavelId: string,
  novoStatus: 'validado' | 'pendente',
): Promise<void> {
  await updateDoc(doc(db, COLECAO, checkinId), {
    status: novoStatus,
    validadoPor: responsavelId,
    validadoEm: agoraTimestamp(),
  });
}
