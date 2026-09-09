// RF10, RN07: turmas pertencem a uma academia ou a um professor autônomo (responsável único)
import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs, documentId,
} from 'firebase/firestore';
import { db } from './firebase';
import { Matricula, NivelTurma, Perfil, Turma } from '../types';
import { agoraTimestamp } from '../utils/datas';
import { LIMITE_CLAUSULA_IN } from '../constants/regras';
import { listarResponsaveisAtivosDoAluno } from './vinculos';

const COLECAO = 'turmas';
const COLECAO_MATRICULAS = 'matriculas';

interface DadosCriarTurma {
  nome: string;
  modalidade: string;
  nivel: NivelTurma;
  descricao?: string;
  professorId?: string;
  autorId: string;
  autorPerfil: Perfil;
}

function emLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    lotes.push(itens.slice(i, i + tamanho));
  }
  return lotes;
}

// RF10: apenas professor ou academia cria turma, e o autor vira o responsável
export async function criarTurma(dados: DadosCriarTurma): Promise<Turma> {
  if (dados.autorPerfil !== 'professor' && dados.autorPerfil !== 'academia') {
    throw new Error('Apenas professores e academias podem criar turmas.');
  }

  const ref = doc(collection(db, COLECAO));
  const agora = agoraTimestamp();
  const turma: Turma = {
    id: ref.id,
    nome: dados.nome,
    modalidade: dados.modalidade,
    nivel: dados.nivel,
    responsavelId: dados.autorId,
    responsavelPerfil: dados.autorPerfil,
    ativa: true,
    criadoEm: agora,
    atualizadoEm: agora,
    // Firestore rejeita campos com valor `undefined`: só entram no documento quando informados
    ...(dados.professorId ? { professorId: dados.professorId } : {}),
    ...(dados.descricao ? { descricao: dados.descricao } : {}),
  };
  await setDoc(ref, turma);
  return turma;
}

export async function buscarTurma(id: string): Promise<Turma | null> {
  const snap = await getDoc(doc(db, COLECAO, id));
  return snap.exists() ? (snap.data() as Turma) : null;
}

export async function listarTurmasPorResponsavel(responsavelId: string): Promise<Turma[]> {
  const q = query(collection(db, COLECAO), where('responsavelId', '==', responsavelId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Turma);
}

// RF11: turmas em que o aluno está efetivamente matriculado
export async function listarTurmasDoAluno(alunoId: string): Promise<Turma[]> {
  const qMatriculas = query(
    collection(db, COLECAO_MATRICULAS),
    where('alunoId', '==', alunoId),
    where('status', '==', 'ativa'),
  );
  const snapMatriculas = await getDocs(qMatriculas);
  const turmaIds = snapMatriculas.docs.map(d => (d.data() as Matricula).turmaId);
  if (turmaIds.length === 0) return [];

  const lotes = emLotes(turmaIds, LIMITE_CLAUSULA_IN);
  const resultados = await Promise.all(
    lotes.map(lote => getDocs(query(collection(db, COLECAO), where(documentId(), 'in', lote)))),
  );
  return resultados.flatMap(snap => snap.docs.map(d => d.data() as Turma));
}

// RF11: origem da lista de matrícula — turmas ativas dos responsáveis com quem o aluno tem vínculo ativo
export async function listarTurmasDisponiveisParaAluno(alunoId: string): Promise<Turma[]> {
  const responsavelIds = await listarResponsaveisAtivosDoAluno(alunoId);
  if (responsavelIds.length === 0) return [];

  const lotes = emLotes(responsavelIds, LIMITE_CLAUSULA_IN);
  const resultados = await Promise.all(
    lotes.map(lote => getDocs(query(
      collection(db, COLECAO),
      where('responsavelId', 'in', lote),
      where('ativa', '==', true),
    ))),
  );
  return resultados.flatMap(snap => snap.docs.map(d => d.data() as Turma));
}

export async function atualizarTurma(id: string, dados: Partial<Turma>): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), { ...dados, atualizadoEm: agoraTimestamp() });
}

// soft delete: nenhuma coleção usa deleteDoc nesta rodada
export async function desativarTurma(id: string): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), { ativa: false, atualizadoEm: agoraTimestamp() });
}
