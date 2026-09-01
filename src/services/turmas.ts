// RF03: CRUD de turmas de treinamento
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Turma } from '../types';

const COLECAO = 'turmas';

export async function criarTurma(turma: Turma): Promise<void> {
  await setDoc(doc(db, COLECAO, turma.id), turma);
}

export async function buscarTurma(id: string): Promise<Turma | null> {
  const snap = await getDoc(doc(db, COLECAO, id));
  return snap.exists() ? (snap.data() as Turma) : null;
}

export async function atualizarTurma(id: string, dados: Partial<Turma>): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), dados);
}

export async function removerTurma(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO, id));
}

export async function listarTurmasPorResponsavel(responsavelId: string): Promise<Turma[]> {
  const q = query(collection(db, COLECAO), where('responsavelId', '==', responsavelId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Turma);
}

export async function listarTurmasPorAcademia(academiaId: string): Promise<Turma[]> {
  const q = query(collection(db, COLECAO), where('academiaId', '==', academiaId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Turma);
}
