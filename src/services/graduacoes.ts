// RF25, RN03: registro de graduações — sempre decisão humana do responsável, nunca automática
// (ver firestore.rules: graduacoes.update/delete são sempre negados, histórico imutável).
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Graduacao } from '../types';

const COLECAO = 'graduacoes';

// Mesmo padrão de criarTurma()/criarMissao(): gera id e criadoEm aqui, o caller só passa os
// campos de negócio. Primeiro consumidor real desta função.
export async function criarGraduacao(dados: Omit<Graduacao, 'id' | 'criadoEm'>): Promise<Graduacao> {
  const ref = doc(collection(db, COLECAO));
  const graduacao: Graduacao = { id: ref.id, criadoEm: new Date(), ...dados };
  await setDoc(ref, graduacao);
  return graduacao;
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
