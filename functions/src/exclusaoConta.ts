// RF29, LGPD: exclusão da conta com limpeza em cascata dos dados pessoais ligados a ela.
// Callable (não gatilho) porque precisa saber QUEM pediu — request.auth.uid é o único uid que a
// função aceita apagar, nunca um uid vindo do corpo da chamada. Roda com Admin SDK (ignora
// firestore.rules), mesmo motivo de sincronizarLeitoresDasSessoesFuturas em index.ts: a limpeza
// precisa consultar coleções por campos que as regras de lista do client não permitem.
//
// Decisão para professor/academia (ver docs/DECISOES_PENDENTES.md, RF29): turmas que têm
// matrícula de algum aluno NÃO são apagadas — viram inativas, as sessões futuras são canceladas e
// as matrículas viram inativas, preservando o histórico (check-ins, graduações, pontos) dos
// alunos, que é dado DELES. Turmas sem nenhuma matrícula são apagadas junto com as sessões. O
// `responsavelId` que fica nesses documentos é só o uid, que deixa de identificar alguém depois
// que `usuarios/{uid}` e a conta no Auth somem.
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import {
  getFirestore, FieldValue, Timestamp,
  type DocumentReference, type Firestore, type Query, type UpdateData, type DocumentData,
} from 'firebase-admin/firestore';

// Limite do WriteBatch do Firestore
const TAMANHO_LOTE = 500;

type Escrita =
  | { tipo: 'apagar'; ref: DocumentReference }
  | { tipo: 'atualizar'; ref: DocumentReference; dados: UpdateData<DocumentData> };

async function gravarEmLotes(db: Firestore, escritas: Escrita[]): Promise<void> {
  for (let i = 0; i < escritas.length; i += TAMANHO_LOTE) {
    const batch = db.batch();
    escritas.slice(i, i + TAMANHO_LOTE).forEach((e) => {
      if (e.tipo === 'apagar') batch.delete(e.ref);
      else batch.update(e.ref, e.dados);
    });
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
  }
}

async function refs(consulta: Query): Promise<DocumentReference[]> {
  const snap = await consulta.get();
  return snap.docs.map((d) => d.ref);
}

// Dados que pertencem ao usuário como ALUNO — apagados sem exceção
async function apagarDadosDoAluno(db: Firestore, uid: string): Promise<void> {
  const consultas: Query[] = [
    db.collection('matriculas').where('alunoId', '==', uid),
    db.collection('checkins').where('alunoId', '==', uid),
    db.collection('classificacoes').where('alunoId', '==', uid),
    db.collection('missoesProgresso').where('alunoId', '==', uid),
    db.collection('graduacoes').where('alunoId', '==', uid),
    db.collection('consentimentosLGPD').where('usuarioId', '==', uid),
    // RF31: histórico de notificações recebidas (vale para qualquer perfil)
    db.collection('notificacoes').where('destinatarioId', '==', uid),
  ];
  const todas = (await Promise.all(consultas.map(refs))).flat();
  await gravarEmLotes(db, todas.map((ref) => ({ tipo: 'apagar', ref })));

  // RF23: o uid sai das listas das missões (público escolhido, leitores e avisos de nova missão)
  const campos = ['alunosAlvoIds', 'leitoresIds', 'alunosNotificadosIds'];
  const missoes = (await Promise.all(campos.map((campo) => refs(db.collection('missoes').where(campo, 'array-contains', uid))))).flat();
  const unicas = [...new Map(missoes.map((ref) => [ref.path, ref])).values()];
  await gravarEmLotes(db, unicas.map((ref) => ({
    tipo: 'atualizar',
    ref,
    dados: Object.fromEntries(campos.map((campo) => [campo, FieldValue.arrayRemove(uid)])),
  })));
}

// RF14, RN09, RNF04: o uid sai de leitoresIds de todas as sessões e classificações (aluno,
// professor ou responsável)
async function removerDosLeitores(db: Firestore, uid: string): Promise<void> {
  const documentos = (await Promise.all([
    refs(db.collection('sessoes').where('leitoresIds', 'array-contains', uid)),
    refs(db.collection('classificacoes').where('leitoresIds', 'array-contains', uid)),
  ])).flat();
  await gravarEmLotes(db, documentos.map((ref) => ({
    tipo: 'atualizar',
    ref,
    dados: { leitoresIds: FieldValue.arrayRemove(uid) },
  })));
}

// RN05, RN06: vínculos em que o usuário é solicitante ou destinatário. Quando ele é o
// destinatário de um vínculo aceito, o id dele também sai de responsaveisIds do solicitante — e,
// se o solicitante for professor, ele volta a ser autônomo (mesmo efeito de encerrarVinculo()).
async function apagarVinculos(db: Firestore, uid: string): Promise<void> {
  const [comoSolicitante, comoDestinatario] = await Promise.all([
    db.collection('vinculos').where('solicitanteId', '==', uid).get(),
    db.collection('vinculos').where('destinatarioId', '==', uid).get(),
  ]);

  const escritas: Escrita[] = [];
  comoSolicitante.docs.forEach((d) => escritas.push({ tipo: 'apagar', ref: d.ref }));
  comoDestinatario.docs.forEach((d) => {
    const vinculo = d.data();
    if (vinculo.status === 'aceito') {
      escritas.push({
        tipo: 'atualizar',
        ref: db.doc(`usuarios/${vinculo.solicitanteId}/privado/vinculos`),
        dados: { responsaveisIds: FieldValue.arrayRemove(uid) },
      });
      if (vinculo.tipo === 'professor-academia') {
        escritas.push({
          tipo: 'atualizar',
          ref: db.doc(`usuarios/${vinculo.solicitanteId}`),
          dados: { autonomo: true, atualizadoEm: Timestamp.now() },
        });
      }
    }
    escritas.push({ tipo: 'apagar', ref: d.ref });
  });
  await gravarEmLotes(db, escritas);
}

// RF10, RN07: turmas de que o usuário é responsável (decisão no topo do arquivo) e turmas de
// academia em que ele só leciona (o campo professorId sai, a academia escolhe outro professor).
async function tratarTurmasDoGestor(db: Firestore, uid: string): Promise<void> {
  const agora = Timestamp.now();
  const escritas: Escrita[] = [];

  const turmas = await db.collection('turmas').where('responsavelId', '==', uid).get();
  for (const turma of turmas.docs) {
    // eslint-disable-next-line no-await-in-loop
    const [matriculas, sessoes] = await Promise.all([
      db.collection('matriculas').where('turmaId', '==', turma.id).get(),
      db.collection('sessoes').where('turmaId', '==', turma.id).get(),
    ]);

    if (matriculas.empty) {
      sessoes.docs.forEach((s) => escritas.push({ tipo: 'apagar', ref: s.ref }));
      escritas.push({ tipo: 'apagar', ref: turma.ref });
      continue;
    }

    escritas.push({ tipo: 'atualizar', ref: turma.ref, dados: { ativa: false, atualizadoEm: agora } });
    sessoes.docs
      .filter((s) => ['agendada', 'aberta'].includes(s.data().status) && s.data().inicio.toMillis() >= agora.toMillis())
      .forEach((s) => escritas.push({ tipo: 'atualizar', ref: s.ref, dados: { status: 'cancelada', atualizadoEm: agora } }));
    // Sem isso a turma inativa (legível só pelo responsável) continuaria na lista de turmas
    // do aluno e a consulta dele seria negada pelas regras.
    matriculas.docs
      .filter((m) => m.data().status === 'ativa')
      .forEach((m) => escritas.push({ tipo: 'atualizar', ref: m.ref, dados: { status: 'inativa', atualizadoEm: agora } }));
  }

  const turmasComoProfessor = await db.collection('turmas').where('professorId', '==', uid).get();
  turmasComoProfessor.docs
    .filter((t) => t.data().responsavelId !== uid)
    .forEach((t) => escritas.push({
      tipo: 'atualizar', ref: t.ref, dados: { professorId: FieldValue.delete(), atualizadoEm: agora },
    }));

  // RF23: missões saem de circulação, o progresso dos alunos (dado deles) fica
  const missoes = await db.collection('missoes').where('responsavelId', '==', uid).get();
  missoes.docs.forEach((m) => escritas.push({ tipo: 'atualizar', ref: m.ref, dados: { ativa: false, atualizadoEm: agora } }));

  // RF33: a personalização de pontos e níveis é só dele
  escritas.push({ tipo: 'apagar', ref: db.doc(`configuracoesGamificacao/${uid}`) });
  // RF33: e a estrutura de faixas personalizada também
  escritas.push({ tipo: 'apagar', ref: db.doc(`estruturasFaixas/${uid}`) });

  await gravarEmLotes(db, escritas);
}

async function apagarFotos(uid: string): Promise<void> {
  try {
    await getStorage().bucket().deleteFiles({ prefix: `usuarios/${uid}/` });
  } catch (e) {
    // Foto é opcional; uma falha aqui não pode impedir o resto da exclusão, mas fica no log
    logger.error(`excluirConta: falha ao apagar arquivos de usuarios/${uid}/`, e);
  }
}

export const excluirConta = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'É preciso estar autenticado para excluir a conta.');
  }

  const db = getFirestore();
  const usuarioSnap = await db.doc(`usuarios/${uid}`).get();
  const perfil = usuarioSnap.data()?.perfil as string | undefined;

  await apagarDadosDoAluno(db, uid);
  await removerDosLeitores(db, uid);
  if (perfil === 'professor' || perfil === 'academia') {
    await tratarTurmasDoGestor(db, uid);
  }
  await apagarVinculos(db, uid);
  await db.recursiveDelete(db.doc(`usuarios/${uid}`));
  await apagarFotos(uid);

  // Por último: se algo acima falhar, a conta continua existindo e o usuário pode tentar de
  // novo (todos os passos são idempotentes).
  try {
    await getAuth().deleteUser(uid);
  } catch (e) {
    if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
  }

  return { excluida: true };
});
