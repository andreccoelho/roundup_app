// RF08, RF09: CRUD de configurações de gamificação por academia ou professor autônomo
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { ConfiguracaoGamificacao } from '../types';

const COLECAO = 'configuracoesGamificacao';

export async function criarConfiguracao(config: ConfiguracaoGamificacao): Promise<void> {
  await setDoc(doc(db, COLECAO, config.id), config);
}

export async function buscarConfiguracao(id: string): Promise<ConfiguracaoGamificacao | null> {
  const snap = await getDoc(doc(db, COLECAO, id));
  return snap.exists() ? (snap.data() as ConfiguracaoGamificacao) : null;
}

export async function atualizarConfiguracao(
  id: string,
  dados: Partial<ConfiguracaoGamificacao>,
): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), dados);
}

export async function removerConfiguracao(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO, id));
}

export async function buscarConfiguracaoPorResponsavel(
  responsavelId: string,
): Promise<ConfiguracaoGamificacao | null> {
  const q = query(collection(db, COLECAO), where('responsavelId', '==', responsavelId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as ConfiguracaoGamificacao;
}
