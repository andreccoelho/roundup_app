// RF13, RF15, RN02, RN08: check-in único por aluno por sessão, dentro da janela de tempo
import {
  doc, updateDoc, runTransaction,
  collection, query, where, orderBy, getDocs,
  type Firestore,
} from 'firebase/firestore';
import { db } from './firebase';
import { CheckIn, Sessao, Matricula, Classificacao, ConfiguracaoGamificacao } from '../types';
import { agoraTimestamp, periodoDe } from '../utils/datas';
import { getDocSeguro } from './firestoreSeguro';
import { XP_POR_CHECKIN_VALIDADO } from '../config/gamificacao';

const COLECAO = 'checkins';
const COLECAO_SESSOES = 'sessoes';
const COLECAO_MATRICULAS = 'matriculas';
const COLECAO_CLASSIFICACOES = 'classificacoes';
const COLECAO_CONFIGURACOES = 'configuracoesGamificacao';

// RF13, RN02, RN08: o ID `${sessaoId}_${alunoId}` garante RN02 por construção;
// a transação evita a corrida entre a checagem e a gravação
export async function realizarCheckIn(sessaoId: string, alunoId: string): Promise<CheckIn> {
  const checkInId = `${sessaoId}_${alunoId}`;
  const sessaoRef = doc(db, COLECAO_SESSOES, sessaoId);
  const checkInRef = doc(db, COLECAO, checkInId);

  return runTransaction(db, async (transacao) => {
    const sessaoSnap = await transacao.get(sessaoRef);
    if (!sessaoSnap.exists()) {
      throw new Error('Sessão não encontrada.');
    }
    const sessao = sessaoSnap.data() as Sessao;

    if (sessao.status === 'cancelada') {
      throw new Error('Esta sessão foi cancelada.');
    }

    const matriculaRef = doc(db, COLECAO_MATRICULAS, `${sessao.turmaId}_${alunoId}`);
    const matriculaSnap = await transacao.get(matriculaRef);
    if (!matriculaSnap.exists() || (matriculaSnap.data() as Matricula).status !== 'ativa') {
      throw new Error('Você não está matriculado nesta turma.');
    }

    const checkInSnap = await transacao.get(checkInRef);
    if (checkInSnap.exists()) {
      throw new Error('Você já fez check-in nesta sessão.');
    }

    const agora = new Date();
    if (agora < sessao.janelaCheckInInicio.toDate()) {
      throw new Error('O check-in ainda não abriu para esta sessão.');
    }
    if (agora > sessao.janelaCheckInFim.toDate()) {
      throw new Error('O check-in desta sessão já encerrou.');
    }

    const checkIn: CheckIn = {
      id: checkInId,
      sessaoId,
      turmaId: sessao.turmaId,
      alunoId,
      responsavelId: sessao.responsavelId,
      dataHora: agoraTimestamp(),
      status: 'pendente',
      pontos: 0,
    };
    transacao.set(checkInRef, checkIn);
    return checkIn;
  });
}

// Mesma classe de limitação documentada em listarMatriculasPorTurma/listarSessoesPorTurma:
// filtrar só por `sessaoId` é recusado pelas regras reais (a regra de `checkins` depende de
// `alunoId`/`responsavelId`, não de `sessaoId`). Filtra pelo campo que a regra verifica
// (`responsavelId`, já gravado em cada checkin) e reduz por sessaoId em memória — usada pelo
// responsável da sessão (gestor), nunca por um professor apenas atribuído (mesma limitação já
// existente para matrículas: só o responsavelId raiz da turma tem acesso).
// RF22: `usuarioId` é o responsável da turma OU o professor atribuído a ela pela academia (campo
// `professorId`, escrito só pelo servidor) — as duas consultas rodam juntas.
export async function listarCheckInsPorSessao(sessaoId: string, usuarioId: string, dbInstancia: Firestore = db): Promise<CheckIn[]> {
  const todos = await listarCheckInsDoUsuario(usuarioId, dbInstancia);
  return todos.filter(c => c.sessaoId === sessaoId);
}

async function listarCheckInsDoUsuario(usuarioId: string, dbInstancia: Firestore): Promise<CheckIn[]> {
  const colecao = collection(dbInstancia, COLECAO);
  const [comoResponsavel, comoProfessor] = await Promise.all([
    getDocs(query(colecao, where('responsavelId', '==', usuarioId))),
    getDocs(query(colecao, where('professorId', '==', usuarioId))),
  ]);
  const porId = new Map<string, CheckIn>();
  [...comoResponsavel.docs, ...comoProfessor.docs].forEach((d) => porId.set(d.id, d.data() as CheckIn));
  return [...porId.values()];
}

// RF24, RF26: todos os check-ins do responsável, sem filtrar por sessão — base para as
// agregações de frequência em src/services/frequencia.ts. Mesma consulta de
// listarCheckInsPorSessao, só sem o filtro em memória por sessaoId.
export async function listarCheckInsPorResponsavel(responsavelId: string): Promise<CheckIn[]> {
  return listarCheckInsDoUsuario(responsavelId, db);
}

// RF15
export async function listarHistoricoDoAluno(alunoId: string): Promise<CheckIn[]> {
  const q = query(
    collection(db, COLECAO),
    where('alunoId', '==', alunoId),
    orderBy('dataHora', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as CheckIn);
}

// getDocSeguro(), não getDoc() direto: ver decisão técnica em services/firestoreSeguro.ts — o
// caso comum aqui é exatamente "ainda não fiz check-in nesta sessão", que a regra nega como
// permission-denied em vez de simplesmente não existir.
export async function buscarCheckInDaSessao(sessaoId: string, alunoId: string): Promise<CheckIn | null> {
  return getDocSeguro<CheckIn>(doc(db, COLECAO, `${sessaoId}_${alunoId}`));
}

// RF22 (Ciclo 3, adiantado aqui para a chamada do professor): valida ou desfaz a validação de
// um check-in já existente. A regra (`resource.data.responsavelId == meuId()`) só permite
// UPDATE — o responsável não pode CRIAR um check-in em nome do aluno (create exige
// `souAluno() && alunoId == meuId()`). Por isso a "chamada" só alterna presença de quem já fez
// o próprio check-in; quem ainda não fez aparece como pendente, sem toggle.
//
// RF16, RN01, RN04, RF33: validar credita os pontos por check-in do responsável (configuração
// dele, ou XP_POR_CHECKIN_VALIDADO por padrão) em checkins.pontos e em
// classificacoes/{alunoId}_{responsavelId}_{AAAA-MM}, no mês (fuso local) em que o treino
// aconteceu. Desfazer a validação estorna exatamente o que o check-in recebeu (`checkin.pontos`),
// no mesmo documento de classificação (`checkin.classificacaoId`) — mesmo que o responsável tenha
// mudado a configuração ou o mês tenha virado nesse meio-tempo. `checkin.pontos > 0` guarda contra
// creditar duas vezes se o professor alternar o toggle repetidamente.
//
// RN01 na regra: o check-in grava `classificacaoId` e a classificação grava `origemCheckinId`, e
// cada lado confere que o outro mudou na MESMA transação com o mesmo delta (ver firestore.rules).
// Por isso os pontos vão como valor literal já somado, não `increment()`: lemos o valor atual
// dentro da transação. Todos os `transacao.get()` vêm antes de qualquer escrita, como o SDK exige.
// RF22: `validadorId` é quem valida — o responsável da turma ou o professor que a academia atribuiu a
// ela. A pontuação sempre vai para o escopo do check-in (`checkin.responsavelId`, a academia).
// `dbInstancia` é injetável para a suíte de regras rodar esta mesma função sob um contexto de teste.
export async function validarCheckIn(
  checkinId: string,
  validadorId: string,
  novoStatus: 'validado' | 'pendente',
  dbInstancia: Firestore = db,
): Promise<void> {
  const checkinRef = doc(dbInstancia, COLECAO, checkinId);

  await runTransaction(dbInstancia, async (transacao) => {
    const checkinSnap = await transacao.get(checkinRef);
    if (!checkinSnap.exists()) {
      throw new Error('Check-in não encontrado.');
    }
    const checkin = checkinSnap.data() as CheckIn;

    const vaiCreditar = novoStatus === 'validado' && checkin.pontos === 0;
    const vaiEstornar = novoStatus === 'pendente' && checkin.pontos > 0;

    const periodo = periodoDe(checkin.dataHora.toDate());
    const classificacaoId = vaiEstornar && checkin.classificacaoId
      ? checkin.classificacaoId
      : `${checkin.alunoId}_${checkin.responsavelId}_${periodo}`;
    const classificacaoRef = doc(dbInstancia, COLECAO_CLASSIFICACOES, classificacaoId);

    let pontosAtuais = 0;
    let pontosDoCheckin = 0;
    if (vaiCreditar || vaiEstornar) {
      const classificacaoSnap = await transacao.get(classificacaoRef);
      pontosAtuais = classificacaoSnap.exists() ? (classificacaoSnap.data() as Classificacao).pontos : 0;
    }
    if (vaiCreditar) {
      const configSnap = await transacao.get(doc(dbInstancia, COLECAO_CONFIGURACOES, checkin.responsavelId));
      pontosDoCheckin = configSnap.exists()
        ? (configSnap.data() as ConfiguracaoGamificacao).pontosPorCheckin
        : XP_POR_CHECKIN_VALIDADO;
    }

    transacao.update(checkinRef, {
      status: novoStatus,
      pontos: vaiCreditar ? pontosDoCheckin : vaiEstornar ? 0 : checkin.pontos,
      validadoPor: validadorId,
      validadoEm: agoraTimestamp(),
      ...(vaiCreditar || vaiEstornar ? { classificacaoId } : {}),
    });

    if (vaiCreditar || vaiEstornar) {
      const delta = vaiCreditar ? pontosDoCheckin : -checkin.pontos;
      transacao.set(
        classificacaoRef,
        {
          id: classificacaoId,
          alunoId: checkin.alunoId,
          responsavelId: checkin.responsavelId,
          periodo: classificacaoId.slice(-7),
          pontos: pontosAtuais + delta,
          origemCheckinId: checkinId,
          atualizadoEm: agoraTimestamp(),
        },
        { merge: true },
      );
    }
  });
}
