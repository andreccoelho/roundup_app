// RF02, RN01: CRUD de vínculos entre atores do sistema
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Vinculo, StatusVinculo } from '../types';

const COLECAO = 'vinculos';

export async function criarVinculo(vinculo: Vinculo): Promise<void> {
  await setDoc(doc(db, COLECAO, vinculo.id), vinculo);
}

export async function buscarVinculo(id: string): Promise<Vinculo | null> {
  const snap = await getDoc(doc(db, COLECAO, id));
  return snap.exists() ? (snap.data() as Vinculo) : null;
}

export async function atualizarVinculo(id: string, dados: Partial<Vinculo>): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), dados);
}

export async function removerVinculo(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO, id));
}

export async function listarVinculosPorSolicitante(solicitanteId: string): Promise<Vinculo[]> {
  const q = query(collection(db, COLECAO), where('solicitanteId', '==', solicitanteId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Vinculo);
}

export async function listarVinculosPorDestinatario(destinatarioId: string): Promise<Vinculo[]> {
  const q = query(collection(db, COLECAO), where('destinatarioId', '==', destinatarioId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Vinculo);
}

export async function listarVinculosPorStatus(
  usuarioId: string,
  status: StatusVinculo,
): Promise<Vinculo[]> {
  const q = query(
    collection(db, COLECAO),
    where('destinatarioId', '==', usuarioId),
    where('status', '==', status),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Vinculo);
}
