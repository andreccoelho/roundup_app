// RF04: CRUD de sessões de treinamento
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Sessao } from '../types';

const COLECAO = 'sessoes';

export async function criarSessao(sessao: Sessao): Promise<void> {
  await setDoc(doc(db, COLECAO, sessao.id), sessao);
}

export async function buscarSessao(id: string): Promise<Sessao | null> {
  const snap = await getDoc(doc(db, COLECAO, id));
  return snap.exists() ? (snap.data() as Sessao) : null;
}

export async function atualizarSessao(id: string, dados: Partial<Sessao>): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), dados);
}

export async function removerSessao(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO, id));
}

export async function listarSessoesPorTurma(turmaId: string): Promise<Sessao[]> {
  const q = query(collection(db, COLECAO), where('turmaId', '==', turmaId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Sessao);
}

export async function listarSessoesPorProfessor(professorId: string): Promise<Sessao[]> {
  const q = query(collection(db, COLECAO), where('professorId', '==', professorId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Sessao);
}
