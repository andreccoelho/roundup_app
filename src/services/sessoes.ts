// RF12, RN07, RN08: sessão de treino pertence a uma turma e define a janela de check-in
import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, orderBy, limit, getDocs,
  type Firestore,
} from 'firebase/firestore';
import { db } from './firebase';
import { Sessao } from '../types';
import { agoraTimestamp, paraTimestamp } from '../utils/datas';
import { MINUTOS_ABERTURA_CHECKIN_ANTES_DO_INICIO } from '../constants/regras';
import { buscarTurma } from './turmas';
import { listarMatriculasPorTurma } from './matriculas';

const COLECAO = 'sessoes';

interface DadosCriarSessao {
  turmaId: string;
  inicio: Date;
  fim: Date;
  descricao?: string;
  autorId: string;
}

// RF12, RN07: só o responsável pela turma ou o professor atribuído a ela cria sessão
export async function criarSessao(dados: DadosCriarSessao): Promise<Sessao> {
  const turma = await buscarTurma(dados.turmaId);
  if (!turma) {
    throw new Error('Turma não encontrada.');
  }
  if (dados.autorId !== turma.responsavelId && dados.autorId !== turma.professorId) {
    throw new Error('Apenas o responsável pela turma ou o professor atribuído pode criar sessões.');
  }
  if (dados.fim <= dados.inicio) {
    throw new Error('O horário de término deve ser depois do horário de início.');
  }

  const ref = doc(collection(db, COLECAO));
  const agora = agoraTimestamp();
  const janelaCheckInInicio = new Date(
    dados.inicio.getTime() - MINUTOS_ABERTURA_CHECKIN_ANTES_DO_INICIO * 60_000,
  );

  // RF14, RNF04: leitoresIds nasce com responsável, professor e os alunos já matriculados
  // na turma neste instante — matrículas futuras são sincronizadas por
  // atualizarLeitoresDasSessoesFuturas() em matriculas.ts
  const matriculas = await listarMatriculasPorTurma(dados.turmaId);
  const alunosAtivos = matriculas.filter(m => m.status === 'ativa').map(m => m.alunoId);
  const leitoresIds = Array.from(new Set([turma.responsavelId, turma.professorId ?? turma.responsavelId, ...alunosAtivos]));

  const sessao: Sessao = {
    id: ref.id,
    turmaId: dados.turmaId,
    responsavelId: turma.responsavelId,
    professorId: turma.professorId ?? turma.responsavelId,
    inicio: paraTimestamp(dados.inicio),
    fim: paraTimestamp(dados.fim),
    janelaCheckInInicio: paraTimestamp(janelaCheckInInicio),
    janelaCheckInFim: paraTimestamp(dados.fim),
    status: 'agendada',
    leitoresIds,
    criadoEm: agora,
    atualizadoEm: agora,
    // Firestore rejeita campos com valor `undefined`
    ...(dados.descricao ? { descricao: dados.descricao } : {}),
  };
  await setDoc(ref, sessao);
  return sessao;
}

export async function buscarSessao(id: string): Promise<Sessao | null> {
  const snap = await getDoc(doc(db, COLECAO, id));
  return snap.exists() ? (snap.data() as Sessao) : null;
}

export async function listarSessoesPorTurma(turmaId: string): Promise<Sessao[]> {
  const q = query(collection(db, COLECAO), where('turmaId', '==', turmaId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Sessao);
}

export async function listarSessoesPorResponsavel(responsavelId: string): Promise<Sessao[]> {
  const q = query(collection(db, COLECAO), where('responsavelId', '==', responsavelId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Sessao);
}

// RF14, RNF04: próximas sessões em que o aluno é leitor — consulta direta por
// array-contains em leitoresIds, sem passar por `matriculas` nem por uma cláusula `in` de
// turmaId. `dbInstancia` é injetável (default: singleton do app) só para a suíte de regras
// no emulador poder rodar esta mesma consulta sob um contexto autenticado de teste — não
// muda o comportamento para nenhum chamador existente, que continua passando só `alunoId`.
export async function listarProximasSessoesDoAluno(alunoId: string, dbInstancia: Firestore = db): Promise<Sessao[]> {
  const agora = paraTimestamp(new Date());
  const snap = await getDocs(query(
    collection(dbInstancia, COLECAO),
    where('leitoresIds', 'array-contains', alunoId),
    where('inicio', '>=', agora),
    orderBy('inicio', 'asc'),
    limit(20),
  ));
  return snap.docs.map(d => d.data() as Sessao);
}

export async function atualizarSessao(id: string, dados: Partial<Sessao>): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), { ...dados, atualizadoEm: agoraTimestamp() });
}

// RF13: abre a janela de check-in manualmente; transições de status, nunca deleteDoc
export async function abrirSessao(id: string): Promise<void> {
  const sessao = await buscarSessao(id);
  if (!sessao) {
    throw new Error('Sessão não encontrada.');
  }
  if (sessao.status !== 'agendada') {
    throw new Error(`Não é possível abrir uma sessão com status "${sessao.status}".`);
  }
  await atualizarSessao(id, { status: 'aberta' });
}

export async function encerrarSessao(id: string): Promise<void> {
  const sessao = await buscarSessao(id);
  if (!sessao) {
    throw new Error('Sessão não encontrada.');
  }
  if (sessao.status !== 'aberta') {
    throw new Error(`Não é possível encerrar uma sessão com status "${sessao.status}".`);
  }
  await atualizarSessao(id, { status: 'encerrada' });
}
