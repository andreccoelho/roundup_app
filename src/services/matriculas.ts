// RF11: matrícula do aluno em turma, condicionada a vínculo ativo com o responsável (RN05)
import { doc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Matricula } from '../types';
import { agoraTimestamp } from '../utils/datas';
import { buscarTurma } from './turmas';
import { existeVinculoAtivoEntre } from './vinculos';
import { getDocSeguro } from './firestoreSeguro';

const COLECAO = 'matriculas';

// RF14, RNF04: sincronizar leitoresIds das sessões futuras da turma NÃO é responsabilidade
// deste service — é feito por Cloud Function (functions/src/index.ts), disparada pela
// criação/atualização deste documento. O client não consegue resolver isso sozinho: ver
// docs/decisoes-tecnicas.md para o motivo (paradoxo de ordem entre ler e ganhar permissão de
// leitura). Este service só cria/atualiza o documento de matrícula.
export async function matricularAluno(turmaId: string, alunoId: string): Promise<Matricula> {
  const id = `${turmaId}_${alunoId}`;
  const ref = doc(db, COLECAO, id);
  // getDocSeguro(), não getDoc() direto: o caso comum é "ainda não tenho matrícula nesta
  // turma" — ver decisão técnica em services/firestoreSeguro.ts.
  const existente = await getDocSeguro<Matricula>(ref);
  if (existente && existente.status === 'ativa') {
    return existente;
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
    criadoEm: existente?.criadoEm ?? agora,
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
  return getDocSeguro<Matricula>(doc(db, COLECAO, `${turmaId}_${alunoId}`));
}

export async function listarMatriculasPorAluno(alunoId: string): Promise<Matricula[]> {
  const q = query(collection(db, COLECAO), where('alunoId', '==', alunoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Matricula);
}

// DECISÃO TÉCNICA (descoberta ao testar o painel do professor contra as regras reais, não só o
// emulador): filtrar só por `turmaId` faz o Firestore RECUSAR a consulta inteira com
// "Missing or insufficient permissions" — a regra de leitura de `matriculas` depende de
// `alunoId`/`responsavelId`, campos que essa consulta não usa como filtro, então o motor de
// regras não consegue provar a consulta seguRA e nega de cara, mesmo que os documentos
// retornados fossem todos permitidos. Mesma classe de limitação já documentada para `turmas` e
// resolvida para `sessoes` via `leitoresIds`. Aqui a correção é filtrar pelo campo que a regra
// realmente verifica (`responsavelId`, já desnormalizado da turma em cada matrícula) e reduzir
// por `turmaId` em memória — o quem-chama já É o responsável (só TurmaDetalheScreen e o painel
// do professor chamam isso, ambos como o dono da turma).
export async function listarMatriculasPorTurma(turmaId: string, responsavelId: string): Promise<Matricula[]> {
  const q = query(collection(db, COLECAO), where('responsavelId', '==', responsavelId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Matricula).filter(m => m.turmaId === turmaId);
}
