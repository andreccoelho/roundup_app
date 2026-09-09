// Adiado para o Ciclo 4 (RF28, RNF10: consentimento LGPD registrado no cadastro).
// Esqueleto mantido; firestore.rules já publica a regra final (é registro de auditoria imutável).
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { ConsentimentoLGPD } from '../types';

const COLECAO = 'consentimentosLGPD';

export async function criarConsentimento(consentimento: ConsentimentoLGPD): Promise<void> {
  await setDoc(doc(db, COLECAO, consentimento.id), consentimento);
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
