// RF33: estrutura de faixas personalizada por responsável (academia ou professor autônomo), um
// documento por responsável em estruturasFaixas/{responsavelId}, com um mapa modalidade → faixas.
// Modalidade sem personalização usa a estrutura padrão (src/utils/faixas.ts). "Restaurar padrão"
// apaga só a modalidade do mapa.
import { doc, getDoc, setDoc, updateDoc, deleteField, FieldPath } from 'firebase/firestore';
import { db } from './firebase';
import { EstruturaFaixas, FaixaConfig } from '../types';
import { estruturaDaModalidade } from '../utils/faixas';

const COLECAO = 'estruturasFaixas';

export async function buscarEstruturaFaixas(responsavelId: string): Promise<EstruturaFaixas | null> {
  const snap = await getDoc(doc(db, COLECAO, responsavelId));
  return snap.exists() ? (snap.data() as EstruturaFaixas) : null;
}

// A estrutura que vale para este responsável nesta modalidade (a dele ou a padrão)
export async function buscarFaixasDaModalidade(responsavelId: string, modalidade: string): Promise<FaixaConfig[]> {
  const estrutura = await buscarEstruturaFaixas(responsavelId);
  return estruturaDaModalidade(estrutura?.modalidades, modalidade);
}

// set + merge com objeto aninhado: troca só a lista desta modalidade (o nome vira chave literal)
export async function salvarFaixasDaModalidade(responsavelId: string, modalidade: string, faixas: FaixaConfig[]): Promise<void> {
  await setDoc(doc(db, COLECAO, responsavelId), {
    id: responsavelId,
    responsavelId,
    modalidades: { [modalidade]: faixas.map(({ id, nome, cor, graus }) => ({ id, nome: nome.trim(), cor, graus })) },
    atualizadoEm: new Date(),
  }, { merge: true });
}

export async function restaurarFaixasPadrao(responsavelId: string, modalidade: string): Promise<void> {
  await updateDoc(doc(db, COLECAO, responsavelId), new FieldPath('modalidades', modalidade), deleteField(), 'atualizadoEm', new Date());
}
