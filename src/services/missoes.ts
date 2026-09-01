// RF05: CRUD de missões; RF06: CRUD de progresso de missões por aluno
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Missao, MissaoProgresso } from '../types';

const COLECAO_MISSOES = 'missoes';
const COLECAO_PROGRESSO = 'missoesProgresso';

// ── Missões ──────────────────────────────────────────────────────────────────

export async function criarMissao(missao: Missao): Promise<void> {
  await setDoc(doc(db, COLECAO_MISSOES, missao.id), missao);
}

export async function buscarMissao(id: string): Promise<Missao | null> {
  const snap = await getDoc(doc(db, COLECAO_MISSOES, id));
  return snap.exists() ? (snap.data() as Missao) : null;
}

export async function atualizarMissao(id: string, dados: Partial<Missao>): Promise<void> {
  await updateDoc(doc(db, COLECAO_MISSOES, id), dados);
}

export async function removerMissao(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO_MISSOES, id));
}

export async function listarMissoesPorResponsavel(responsavelId: string): Promise<Missao[]> {
  const q = query(collection(db, COLECAO_MISSOES), where('responsavelId', '==', responsavelId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Missao);
}

// ── Progresso de missões ──────────────────────────────────────────────────────

export async function criarProgresso(progresso: MissaoProgresso): Promise<void> {
  await setDoc(doc(db, COLECAO_PROGRESSO, progresso.id), progresso);
}

export async function buscarProgresso(id: string): Promise<MissaoProgresso | null> {
  const snap = await getDoc(doc(db, COLECAO_PROGRESSO, id));
  return snap.exists() ? (snap.data() as MissaoProgresso) : null;
}

export async function atualizarProgresso(
  id: string,
  dados: Partial<MissaoProgresso>,
): Promise<void> {
  await updateDoc(doc(db, COLECAO_PROGRESSO, id), dados);
}

export async function removerProgresso(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO_PROGRESSO, id));
}

export async function listarProgressoPorAluno(alunoId: string): Promise<MissaoProgresso[]> {
  const q = query(collection(db, COLECAO_PROGRESSO), where('alunoId', '==', alunoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as MissaoProgresso);
}

export async function listarProgressoPorMissao(missaoId: string): Promise<MissaoProgresso[]> {
  const q = query(collection(db, COLECAO_PROGRESSO), where('missaoId', '==', missaoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as MissaoProgresso);
}
