// RF18 (progresso de missões) e RF23 (criação de missões, MissoesGestorScreen). O progresso das
// missões presença/pontuação/sequência é automático (Cloud Function atualizarMissoesNoCheckIn);
// daqui o client só marca a conclusão de missão personalizada.
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, deleteField,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Missao, MissaoProgresso } from '../types';

const COLECAO_MISSOES = 'missoes';
const COLECAO_PROGRESSO = 'missoesProgresso';

// ── Missões ──────────────────────────────────────────────────────────────────

// RF23: mesmo padrão de criarTurma() — gera id e timestamps aqui, o caller só passa os campos
// de negócio. Primeiro consumidor real desta função (antes só o esqueleto existia).
// RF23: público-alvo e vigência são obrigatórios na criação (firestore.rules). Os campos de
// servidor (leitoresIds, situacao, alunosNotificadosIds) ficam de fora: a Cloud Function preenche.
export type DadosNovaMissao = Omit<Missao, 'id' | 'criadoEm' | 'atualizadoEm' | 'leitoresIds' | 'situacao' | 'alunosNotificadosIds'>
  & Required<Pick<Missao, 'publicoAlvo' | 'vigenciaInicio' | 'vigenciaFim'>>;

export async function criarMissao(dados: DadosNovaMissao): Promise<Missao> {
  const ref = doc(collection(db, COLECAO_MISSOES));
  const agora = new Date();
  const missao: Missao = { id: ref.id, criadoEm: agora, atualizadoEm: agora, ...dados };
  await setDoc(ref, missao);
  return missao;
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

// RF18, RF23: missões que o aluno pode ver, de todos os responsáveis de uma vez. `leitoresIds` é
// mantido pela Cloud Function (functions/src/missoesPublico.ts): o público-alvo enquanto a missão
// está vigente e, depois, só quem a concluiu. O filtro é o mesmo campo da regra de leitura, o que
// torna a consulta provável (docs/decisoes-tecnicas.md).
export async function listarMissoesDoAluno(alunoId: string): Promise<Missao[]> {
  const q = query(collection(db, COLECAO_MISSOES), where('leitoresIds', 'array-contains', alunoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Missao);
}

// ── Progresso de missões ──────────────────────────────────────────────────────

export async function buscarProgresso(id: string): Promise<MissaoProgresso | null> {
  const snap = await getDoc(doc(db, COLECAO_PROGRESSO, id));
  return snap.exists() ? (snap.data() as MissaoProgresso) : null;
}

export async function listarProgressoPorAluno(alunoId: string): Promise<MissaoProgresso[]> {
  const q = query(collection(db, COLECAO_PROGRESSO), where('alunoId', '==', alunoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as MissaoProgresso);
}

// Filtra também por responsavelId: só por missaoId a consulta não é provada pela regra de leitura
// (que olha alunoId/responsavelId — ver docs/decisoes-tecnicas.md).
export async function listarProgressoDaMissao(missaoId: string, responsavelId: string): Promise<MissaoProgresso[]> {
  const q = query(
    collection(db, COLECAO_PROGRESSO),
    where('responsavelId', '==', responsavelId),
    where('missaoId', '==', missaoId),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as MissaoProgresso);
}

// RF18, RF23: o responsável marca ou desmarca a conclusão de uma missão personalizada para um
// aluno. Os pontos da missão são creditados (ou estornados) pela Cloud Function
// creditarPontosDaMissao, não aqui — o client não escreve pontos de missão.
export async function marcarConclusaoPersonalizada(missao: Missao, alunoId: string, concluida: boolean): Promise<void> {
  const id = `${missao.id}_${alunoId}`;
  const agora = new Date();
  await setDoc(doc(db, COLECAO_PROGRESSO, id), {
    id,
    missaoId: missao.id,
    alunoId,
    responsavelId: missao.responsavelId,
    progressoAtual: concluida ? missao.meta : 0,
    concluida,
    dataConclusao: concluida ? agora : deleteField(),
    atualizadoEm: agora,
  }, { merge: true });
}
