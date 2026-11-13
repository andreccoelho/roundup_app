// RF31: envio das notificações push — lembrete de sessão, nova missão e conquista obtida —
// respeitando usuarios.preferenciasNotificacao (ausente ou true = quer receber).
//
// Envio pelo serviço de push da Expo (https://exp.host/--/api/v2/push/send) para os tokens que o
// app grava em usuarios/{uid}/privado/notificacoes (src/services/notificacoes.ts). Cada
// notificação, enviada ou não, vira um registro em `notificacoes` (coleção sem acesso de client)
// com o status: 'enviado', 'erro', 'semDispositivo' ou 'simulado' — no emulador nada sai para a
// internet, o registro é a prova do que teria sido enviado.
//
// Para funcionar de verdade (passo a passo em docs/ROTEIRO_TESTE_NOTIFICACOES.md): plano Blaze
// (deploy de functions e Cloud Scheduler), `eas init` (projectId), google-services.json e chave FCM V1
// no EAS (Android) ou chave APNs (iOS), e um development build. Opcional: a variável EXPO_ACCESS_TOKEN, se o "enhanced security" de push
// estiver ligado no projeto Expo.
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { FUSO, diaLocal, limitesDoDia } from './datas';
import { selecionarLembretes, textoLembrete } from './notificacoesRegras';

type TipoNotificacao = 'lembreteSessao' | 'novaMissao' | 'conquista';

const URL_EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';
const LOTE_EXPO = 100;

interface Mensagem {
  titulo: string;
  corpo: string;
  dados?: Record<string, string>;
}

function emulador(): boolean {
  return process.env.FUNCTIONS_EMULATOR === 'true';
}

function refPrivado(db: Firestore, uid: string) {
  return db.doc(`usuarios/${uid}/privado/notificacoes`);
}

interface RespostaExpo {
  data?: { status: 'ok' | 'error'; details?: { error?: string } }[];
}

// Devolve os tokens que a Expo disse não existirem mais (app desinstalado, token trocado)
async function enviarExpo(tokens: string[], mensagem: Mensagem): Promise<{ invalidos: string[]; falhou: boolean }> {
  const invalidos: string[] = [];
  let falhou = false;
  for (let i = 0; i < tokens.length; i += LOTE_EXPO) {
    const lote = tokens.slice(i, i + LOTE_EXPO);
    // eslint-disable-next-line no-await-in-loop
    const resposta = await fetch(URL_EXPO_PUSH, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(lote.map((to) => ({
        to, title: mensagem.titulo, body: mensagem.corpo, data: mensagem.dados ?? {}, sound: 'default', channelId: 'padrao',
      }))),
    });
    if (!resposta.ok) {
      falhou = true;
      logger.error(`Expo push respondeu ${resposta.status}: ${await resposta.text()}`);
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const corpo = (await resposta.json()) as RespostaExpo;
    (corpo.data ?? []).forEach((ticket, j) => {
      if (ticket.status === 'error') {
        falhou = true;
        if (ticket.details?.error === 'DeviceNotRegistered') invalidos.push(lote[j]);
      }
    });
  }
  return { invalidos, falhou };
}

// Envia para cada uid que quer este tipo de notificação e registra o resultado em `notificacoes`.
// Devolve o status de cada uid ('desligado' = o usuário desligou este tipo; esse não é registrado).
export async function notificar(
  db: Firestore, uids: string[], tipo: TipoNotificacao, mensagem: Mensagem,
): Promise<Record<string, string>> {
  const resultado: Record<string, string> = {};
  const unicos = [...new Set(uids)];
  if (unicos.length === 0) return resultado;
  const usuarios = await db.getAll(...unicos.map((uid) => db.doc(`usuarios/${uid}`)));
  const querem = usuarios
    .filter((u) => u.exists && u.data()?.preferenciasNotificacao?.[tipo] !== false)
    .map((u) => u.id);
  unicos.filter((uid) => !querem.includes(uid)).forEach((uid) => { resultado[uid] = 'desligado'; });
  if (querem.length === 0) return resultado;
  const privados = await db.getAll(...querem.map((uid) => refPrivado(db, uid)));

  await Promise.all(privados.map(async (privado, i) => {
    const uid = querem[i];
    const tokens: string[] = privado.data()?.tokens ?? [];
    let status: string;
    if (tokens.length === 0) {
      status = 'semDispositivo';
    } else if (emulador()) {
      status = 'simulado';
    } else {
      try {
        const { invalidos, falhou } = await enviarExpo(tokens, mensagem);
        if (invalidos.length > 0) await refPrivado(db, uid).update({ tokens: FieldValue.arrayRemove(...invalidos) });
        status = falhou ? 'erro' : 'enviado';
      } catch (e) {
        logger.error(`notificar: falha ao enviar ${tipo} para ${uid}`, e);
        status = 'erro';
      }
    }
    resultado[uid] = status;
    await db.collection('notificacoes').add({
      destinatarioId: uid, tipo, titulo: mensagem.titulo, corpo: mensagem.corpo, status, criadoEm: Timestamp.now(),
    });
  }));
  return resultado;
}

// Conquista notificada uma vez só por aluno: a chave entra em conquistasNotificadas numa transação
// antes do envio, então um gatilho repetido ou um estorno seguido de revalidação não avisa de novo.
async function marcarConquistaNova(db: Firestore, uid: string, chave: string): Promise<boolean> {
  return db.runTransaction(async (t) => {
    const ref = refPrivado(db, uid);
    const atuais: string[] = (await t.get(ref)).data()?.conquistasNotificadas ?? [];
    if (atuais.includes(chave)) return false;
    t.set(ref, { conquistasNotificadas: FieldValue.arrayUnion(chave) }, { merge: true });
    return true;
  });
}

export async function notificarConquista(db: Firestore, uid: string, chave: string, mensagem: Mensagem): Promise<void> {
  if (await marcarConquistaNova(db, uid, chave)) {
    await notificar(db, [uid], 'conquista', mensagem);
  }
}

// ---------- nova missão ----------
// RF23, RF31: o aviso de nova missão respeita o público-alvo e a vigência — ver missoesPublico.ts.

// ---------- conquistas ----------
export const notificarMissaoConcluida = onDocumentWritten(
  'missoesProgresso/{progressoId}',
  async (event) => {
    const antes = event.data?.before.data();
    const depois = event.data?.after.data();
    if (!depois?.concluida || antes?.concluida) return;
    const db = getFirestore();
    const missao = (await db.doc(`missoes/${depois.missaoId}`).get()).data();
    await notificarConquista(db, depois.alunoId, `missao:${depois.missaoId}`, {
      titulo: 'Missão concluída',
      corpo: missao ? `${missao.titulo} — +${missao.pontos} pts.` : 'Você concluiu uma missão.',
      dados: { tela: 'Missoes' },
    });
  },
);

export const notificarGraduacao = onDocumentCreated(
  'graduacoes/{graduacaoId}',
  async (event) => {
    const graduacao = event.data?.data();
    if (!graduacao) return;
    await notificarConquista(getFirestore(), graduacao.alunoId, `graduacao:${event.params.graduacaoId}`, {
      titulo: 'Nova graduação',
      corpo: `Parabéns: ${graduacao.grau} em ${graduacao.modalidade}.`,
      dados: { tela: 'Perfil' },
    });
  },
);

// RF19: as medalhas (marcos de treinos e de sequência) são concedidas e avisadas em medalhas.ts.

// ---------- lembrete de sessão ----------
// Uma vez por dia, às 7h: um lembrete por aluno com sessão agendada ou aberta hoje, com o horário
// da primeira. `ultimoLembrete` no documento privado garante no máximo um por dia mesmo se a
// função rodar de novo (retry do Scheduler).
export async function enviarLembretesDoDia(agora: Date, db: Firestore = getFirestore()): Promise<void> {
  const { inicio, fim } = limitesDoDia(agora);
  const hoje = diaLocal(agora);
  const sessoesSnap = await db.collection('sessoes')
    .where('inicio', '>=', Timestamp.fromDate(inicio))
    .where('inicio', '<', Timestamp.fromDate(fim))
    .get();
  const sessoes = sessoesSnap.docs
    .map((s) => s.data())
    .filter((s) => s.status === 'agendada' || s.status === 'aberta')
    .map((s) => ({
      inicio: (s.inicio as Timestamp).toDate(),
      leitoresIds: (s.leitoresIds ?? []) as string[],
      responsavelId: s.responsavelId as string,
      professorId: s.professorId as string,
    }));

  const candidatos = selecionarLembretes(sessoes, new Map(), hoje);
  for (const [alunoId, primeiraSessao] of candidatos) {
    // eslint-disable-next-line no-await-in-loop
    const novo = await db.runTransaction(async (t) => {
      const ref = refPrivado(db, alunoId);
      if ((await t.get(ref)).data()?.ultimoLembrete === hoje) return false;
      t.set(ref, { ultimoLembrete: hoje }, { merge: true });
      return true;
    });
    if (novo) {
      // eslint-disable-next-line no-await-in-loop
      await notificar(db, [alunoId], 'lembreteSessao', {
        titulo: 'Treino hoje',
        corpo: textoLembrete(primeiraSessao),
        dados: { tela: 'Agenda' },
      });
    }
  }
}

export const enviarLembretesDeSessao = onSchedule(
  { schedule: '0 7 * * *', timeZone: FUSO },
  async () => {
    await enviarLembretesDoDia(new Date());
  },
);

// ---------- teste no aparelho ----------
// RF31: botão "Enviar teste" da tela Notificações (docs/ROTEIRO_TESTE_NOTIFICACOES.md). Manda uma
// notificação de exemplo do tipo pedido SÓ para quem chamou, pelo mesmo caminho real (preferência,
// token, Expo, registro em `notificacoes`), e devolve o status para a tela explicar o resultado.
// Não toca em missão, conquista nem lembrete de verdade. Limite: um teste a cada 15 s por usuário.
const TIPOS_TESTE: TipoNotificacao[] = ['lembreteSessao', 'novaMissao', 'conquista'];
const MENSAGENS_TESTE: Record<TipoNotificacao, Mensagem> = {
  lembreteSessao: { titulo: 'Treino hoje (teste)', corpo: 'Assim chega o lembrete do dia de treino.', dados: { tela: 'Agenda' } },
  novaMissao: { titulo: 'Nova missão (teste)', corpo: 'Assim chega o aviso de uma missão nova.', dados: { tela: 'Missoes' } },
  conquista: { titulo: 'Conquista (teste)', corpo: 'Assim chega o aviso de uma conquista.', dados: { tela: 'Perfil' } },
};
export const INTERVALO_TESTE_MS = 15_000;

export const enviarNotificacaoDeTeste = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'É preciso estar autenticado.');
  const tipo = request.data?.tipo as TipoNotificacao;
  if (!TIPOS_TESTE.includes(tipo)) throw new HttpsError('invalid-argument', 'Tipo de notificação desconhecido.');

  const db = getFirestore();
  const liberado = await db.runTransaction(async (t) => {
    const ref = refPrivado(db, uid);
    const ultimo: number = (await t.get(ref)).data()?.ultimoTesteMs ?? 0;
    if (Date.now() - ultimo < INTERVALO_TESTE_MS) return false;
    t.set(ref, { ultimoTesteMs: Date.now() }, { merge: true });
    return true;
  });
  if (!liberado) throw new HttpsError('resource-exhausted', 'Espere alguns segundos antes de outro teste.');

  const status = (await notificar(db, [uid], tipo, MENSAGENS_TESTE[tipo]))[uid] ?? 'desligado';
  return { status };
});
