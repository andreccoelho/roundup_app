// RF19: medalhas persistidas, com data de conquista, em usuarios/{alunoId}/medalhas/{marcoId}.
// Só esta função escreve ali (Admin SDK); o client só lê (firestore.rules).
//
// Gatilhos: check-in que passa a 'validado' (marcos de treinos e de sequência) e graduação
// registrada (marco de graduação). A cada disparo, o histórico do aluno é recalculado do zero
// (medalhasRegras.ts) e cada marco atingido que ainda não tem documento vira uma medalha nova.
//
// Decisão (docs/DECISOES_PENDENTES.md, item 5): medalha conquistada NÃO é retirada. Um estorno de
// validação ou uma sequência quebrada depois não apagam o documento; o recálculo só cria o que falta.
//
// RF31: a medalha nova de treinos ou de sequência é avisada (uma vez por aluno, mesma chave
// `medalha:{id}` de conquistasNotificadas usada antes desta mudança, então quem já foi avisado não
// é avisado de novo). A de graduação não, porque a própria graduação já é avisada (notificacoes.ts).
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { MARCOS, datasDeConquista, type TreinoValidado } from './medalhasRegras';
import { notificarConquista } from './notificacoes';

export type OrigemMedalha = 'checkin' | 'graduacao' | 'migracao';

interface Opcoes {
  origem: OrigemMedalha;
  aplicar?: boolean;    // false: só calcula (dry-run da migração)
  notificar?: boolean;  // a migração não avisa
}

function ms(valor: unknown): number | null {
  if (valor instanceof Timestamp) return valor.toMillis();
  if (valor instanceof Date) return valor.getTime();
  return null;
}

// Devolve as medalhas novas (concedidas, ou que seriam concedidas com aplicar: false)
export async function avaliarMedalhas(
  db: Firestore,
  alunoId: string,
  { origem, aplicar = true, notificar = true }: Opcoes,
): Promise<{ id: string; conquistadaEm: Date }[]> {
  const colecao = db.collection(`usuarios/${alunoId}/medalhas`);
  const [checkins, sessoes, graduacoes, existentes] = await Promise.all([
    db.collection('checkins').where('alunoId', '==', alunoId).get(),
    db.collection('sessoes').where('leitoresIds', 'array-contains', alunoId).get(),
    db.collection('graduacoes').where('alunoId', '==', alunoId).get(),
    colecao.get(),
  ]);
  const agora = Date.now();
  const treinos: TreinoValidado[] = checkins.docs
    .map((c) => c.data())
    .filter((c) => c.status === 'validado')
    .map((c) => ({ sessaoId: c.sessaoId as string, quandoMs: ms(c.validadoEm) ?? ms(c.dataHora) ?? agora }));
  const datas = datasDeConquista(
    treinos,
    sessoes.docs
      .map((s) => ({
        id: s.id,
        status: s.data().status as string,
        janelaFimMs: ms(s.data().janelaCheckInFim) ?? 0,
        inicioMs: ms(s.data().inicio) ?? 0,
      }))
      .filter((s) => s.inicioMs <= agora),
    new Map(checkins.docs.map((c) => [c.data().sessaoId as string, c.data().status as string])),
    graduacoes.docs.map((g) => ms(g.data().dataGraduacao) ?? ms(g.data().criadoEm) ?? agora),
    agora,
  );

  const jaTem = new Set(existentes.docs.map((d) => d.id));
  // Na migração, a data é a do histórico; num gatilho, a medalha é conquistada agora.
  const novas = MARCOS.filter((m) => datas.has(m.id) && !jaTem.has(m.id)).map((m) => ({
    marco: m,
    conquistadaEm: new Date(origem === 'migracao' ? (datas.get(m.id) as number) : agora),
  }));
  if (!aplicar) return novas.map((n) => ({ id: n.marco.id, conquistadaEm: n.conquistadaEm }));

  const concedidas: { id: string; conquistadaEm: Date }[] = [];
  for (const { marco, conquistadaEm } of novas) {
    const ref = colecao.doc(marco.id);
    // Transação: dois gatilhos ao mesmo tempo não criam (nem avisam) a mesma medalha duas vezes
    // eslint-disable-next-line no-await-in-loop
    const criada = await db.runTransaction(async (t) => {
      if ((await t.get(ref)).exists) return false;
      t.create(ref, {
        id: marco.id,
        tipo: marco.tipo,
        quantidade: marco.quantidade,
        rotulo: marco.rotulo,
        conquistadaEm: Timestamp.fromDate(conquistadaEm),
        origem,
        registradaEm: Timestamp.now(),
      });
      return true;
    });
    if (!criada) continue;
    concedidas.push({ id: marco.id, conquistadaEm });
    if (notificar && marco.tipo !== 'graduacoes') {
      // eslint-disable-next-line no-await-in-loop
      await notificarConquista(db, alunoId, `medalha:${marco.id}`, {
        titulo: 'Medalha conquistada',
        corpo: `Você chegou a ${marco.rotulo}.`,
        dados: { tela: 'Perfil' },
      });
    }
  }
  return concedidas;
}

export const concederMedalhasNoCheckIn = onDocumentUpdated('checkins/{checkinId}', async (event) => {
  const antes = event.data?.before.data();
  const depois = event.data?.after.data();
  if (!depois || depois.status !== 'validado' || antes?.status === 'validado') return;
  await avaliarMedalhas(getFirestore(), depois.alunoId, { origem: 'checkin' });
});

export const concederMedalhasNaGraduacao = onDocumentCreated('graduacoes/{graduacaoId}', async (event) => {
  const graduacao = event.data?.data();
  if (!graduacao?.alunoId) return;
  await avaliarMedalhas(getFirestore(), graduacao.alunoId, { origem: 'graduacao' });
});
