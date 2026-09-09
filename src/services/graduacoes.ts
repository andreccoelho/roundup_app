// Adiado para o Ciclo 3 (RF25, RN03: registro de graduações).
// Esqueleto mantido; a coleção segue bloqueada em firestore.rules até ser modelada.
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Graduacao } from '../types';

const COLECAO = 'graduacoes';

export async function criarGraduacao(graduacao: Graduacao): Promise<void> {
  await setDoc(doc(db, COLECAO, graduacao.id), graduacao);
}

export async function buscarGraduacao(id: string): Promise<Graduacao | null> {
  const snap = await getDoc(doc(db, COLECAO, id));
  return snap.exists() ? (snap.data() as Graduacao) : null;
}

export async function atualizarGraduacao(id: string, dados: Partial<Graduacao>): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), dados);
}

export async function removerGraduacao(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO, id));
}

export async function listarGraduacoesPorAluno(alunoId: string): Promise<Graduacao[]> {
  const q = query(collection(db, COLECAO), where('alunoId', '==', alunoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Graduacao);
}
