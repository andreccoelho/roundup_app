// RF28, RNF10: consentimento LGPD registrado no cadastro. Registro de auditoria imutável —
// firestore.rules nega update/delete para qualquer um, inclusive o dono.
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { ConsentimentoLGPD } from '../types';

const COLECAO = 'consentimentosLGPD';

// Mesmo padrão de criarTurma()/criarMissao()/criarGraduacao(): gera id e dataHora aqui, o
// caller só passa os campos de negócio. Primeiro consumidor real desta função.
export async function criarConsentimento(dados: Omit<ConsentimentoLGPD, 'id' | 'dataHora'>): Promise<ConsentimentoLGPD> {
  const ref = doc(collection(db, COLECAO));
  const consentimento: ConsentimentoLGPD = { id: ref.id, dataHora: new Date(), ...dados };
  await setDoc(ref, consentimento);
  return consentimento;
}

export async function buscarConsentimento(id: string): Promise<ConsentimentoLGPD | null> {
  const snap = await getDoc(doc(db, COLECAO, id));
  return snap.exists() ? (snap.data() as ConsentimentoLGPD) : null;
}

export async function atualizarConsentimento(
  id: string,
  dados: Partial<ConsentimentoLGPD>,
): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), dados);
}

export async function removerConsentimento(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO, id));
}

export async function listarConsentimentosPorUsuario(
  usuarioId: string,
): Promise<ConsentimentoLGPD[]> {
  const q = query(collection(db, COLECAO), where('usuarioId', '==', usuarioId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as ConsentimentoLGPD);
}
