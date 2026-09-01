// RF13, RN02: CRUD de check-ins — check-in único por sessão por aluno
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { CheckIn } from '../types';

const COLECAO = 'checkins';

export async function criarCheckIn(checkIn: CheckIn): Promise<void> {
  await setDoc(doc(db, COLECAO, checkIn.id), checkIn);
}

export async function buscarCheckIn(id: string): Promise<CheckIn | null> {
  const snap = await getDoc(doc(db, COLECAO, id));
  return snap.exists() ? (snap.data() as CheckIn) : null;
}

export async function atualizarCheckIn(id: string, dados: Partial<CheckIn>): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), dados);
}

export async function removerCheckIn(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO, id));
}

export async function listarCheckInsPorSessao(sessaoId: string): Promise<CheckIn[]> {
  const q = query(collection(db, COLECAO), where('sessaoId', '==', sessaoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as CheckIn);
}

export async function listarCheckInsPorAluno(alunoId: string): Promise<CheckIn[]> {
  const q = query(collection(db, COLECAO), where('alunoId', '==', alunoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as CheckIn);
}

// RN02: verifica se o aluno já fez check-in nesta sessão
export async function buscarCheckInDaSessao(
  sessaoId: string,
  alunoId: string,
): Promise<CheckIn | null> {
  const q = query(
    collection(db, COLECAO),
    where('sessaoId', '==', sessaoId),
    where('alunoId', '==', alunoId),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as CheckIn;
}
