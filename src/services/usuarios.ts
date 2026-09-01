// RF01: CRUD de usuários
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Usuario } from '../types';

const COLECAO = 'usuarios';

export async function criarUsuario(usuario: Usuario): Promise<void> {
  await setDoc(doc(db, COLECAO, usuario.id), usuario);
}

export async function buscarUsuario(id: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, COLECAO, id));
  return snap.exists() ? (snap.data() as Usuario) : null;
}

export async function atualizarUsuario(id: string, dados: Partial<Usuario>): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), dados);
}

export async function removerUsuario(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO, id));
}

export async function listarUsuariosPorPerfil(perfil: Usuario['perfil']): Promise<Usuario[]> {
  const q = query(collection(db, COLECAO), where('perfil', '==', perfil));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Usuario);
}
