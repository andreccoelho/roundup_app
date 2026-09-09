// RF11: matrícula do aluno em turma, condicionada a vínculo ativo com o responsável (RN05)
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Matricula } from '../types';
import { agoraTimestamp } from '../utils/datas';
import { buscarTurma } from './turmas';
import { existeVinculoAtivoEntre } from './vinculos';

const COLECAO = 'matriculas';

// RF14, RNF04: sincronizar leitoresIds das sessões futuras da turma NÃO é responsabilidade
// deste service — é feito por Cloud Function (functions/src/index.ts), disparada pela
// criação/atualização deste documento. O client não consegue resolver isso sozinho: ver
// docs/decisoes-tecnicas.md para o motivo (paradoxo de ordem entre ler e ganhar permissão de
// leitura). Este service só cria/atualiza o documento de matrícula.
export async function matricularAluno(turmaId: string, alunoId: string): Promise<Matricula> {
  const id = `${turmaId}_${alunoId}`;
  const ref = doc(db, COLECAO, id);
  const existente = await getDoc(ref);
  if (existente.exists() && (existente.data() as Matricula).status === 'ativa') {
    return existente.data() as Matricula;
  }

  const turma = await buscarTurma(turmaId);
  if (!turma) {
    throw new Error('Turma não encontrada.');
  }

  const vinculoAtivo = await existeVinculoAtivoEntre(alunoId, turma.responsavelId);
  if (!vinculoAtivo) {
    throw new Error('É necessário ter vínculo ativo com o responsável da turma para se matricular.');
  }

  const agora = agoraTimestamp();
  const matricula: Matricula = {
    id,
    turmaId,
    alunoId,
    responsavelId: turma.responsavelId,
    status: 'ativa',
    criadoEm: existente.exists() ? (existente.data() as Matricula).criadoEm : agora,
    atualizadoEm: agora,
  };
  await setDoc(ref, matricula);
  return matricula;
}

export async function cancelarMatricula(turmaId: string, alunoId: string): Promise<void> {
  const id = `${turmaId}_${alunoId}`;
  await updateDoc(doc(db, COLECAO, id), { status: 'inativa', atualizadoEm: agoraTimestamp() });
}

export async function buscarMatricula(turmaId: string, alunoId: string): Promise<Matricula | null> {
  const snap = await getDoc(doc(db, COLECAO, `${turmaId}_${alunoId}`));
  return snap.exists() ? (snap.data() as Matricula) : null;
}

export async function listarMatriculasPorAluno(alunoId: string): Promise<Matricula[]> {
  const q = query(collection(db, COLECAO), where('alunoId', '==', alunoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Matricula);
}

export async function listarMatriculasPorTurma(turmaId: string): Promise<Matricula[]> {
  const q = query(collection(db, COLECAO), where('turmaId', '==', turmaId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Matricula);
}
