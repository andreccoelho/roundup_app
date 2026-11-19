// RF19: teste de integração de functions/src/medalhas.ts — medalha registrada com data pelo
// servidor, sem duplicar, sem retirar no estorno, e migração com a data do histórico.
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, Timestamp } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, semear, PROJECT_ID,
  usuarioBase, checkinBase, graduacaoBase,
} from '../rules/helpers';
import { aguardar } from './emuladores';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

jest.setTimeout(40000);

const UM_DIA = 24 * 60 * 60 * 1000;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function medalha(id: string): Promise<Record<string, any> | undefined> {
  let dados: Record<string, any> | undefined;
  await semear(async (db) => {
    const snap = await getDoc(doc(db, 'usuarios', 'aluno1', 'medalhas', id));
    dados = snap.exists() ? snap.data() : undefined;
  });
  return dados;
}

async function avisosDeMedalha(): Promise<number> {
  let total = 0;
  await semear(async (db) => {
    const snap = await getDocs(query(collection(db, 'notificacoes'), where('destinatarioId', '==', 'aluno1')));
    total = snap.docs.filter((d) => d.data().titulo === 'Medalha conquistada').length;
  });
  return total;
}

// 9 check-ins validados (um a cada 3 dias, validadoEm = dia do treino) e 1 pendente
async function semearNoveValidados(): Promise<void> {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'notificacoes'), { tokens: ['ExponentPushToken[aluno1]'] });
    for (let i = 0; i < 10; i += 1) {
      const quando = Timestamp.fromMillis(Date.now() - (i + 1) * 3 * UM_DIA);
      await setDoc(doc(db, 'checkins', `s${i}_aluno1`), checkinBase(`s${i}`, 'turma1', 'aluno1', 'academia1', {
        status: i < 9 ? 'validado' : 'pendente', dataHora: quando, ...(i < 9 ? { validadoEm: quando } : {}),
      }));
    }
  });
}

describe('medalhas persistidas (RF19)', () => {
  test('10º treino validado registra a medalha com data e origem, e avisa uma vez', async () => {
    await semearNoveValidados();
    const antes = Date.now();
    await semear(async (db) => {
      await updateDoc(doc(db, 'checkins', 's9_aluno1'), { status: 'validado', validadoEm: Timestamp.now() });
    });
    await aguardar(async () => (await medalha('treinos-10')) !== undefined);
    const m = await medalha('treinos-10');
    expect(m).toMatchObject({ id: 'treinos-10', tipo: 'treinos', quantidade: 10, origem: 'checkin' });
    expect((m?.conquistadaEm as Timestamp).toMillis()).toBeGreaterThanOrEqual(antes - 1000);
    await aguardar(async () => (await avisosDeMedalha()) === 1);
    expect(await medalha('treinos-30')).toBeUndefined();
  });

  test('estorno não retira a medalha, e validar de novo não duplica nem avisa outra vez', async () => {
    await semearNoveValidados();
    await semear(async (db) => {
      await updateDoc(doc(db, 'checkins', 's9_aluno1'), { status: 'validado' });
    });
    await aguardar(async () => (await medalha('treinos-10')) !== undefined);
    const data = (await medalha('treinos-10'))?.conquistadaEm as Timestamp;

    await semear(async (db) => {
      await updateDoc(doc(db, 'checkins', 's9_aluno1'), { status: 'pendente' });
    });
    await semear(async (db) => {
      await updateDoc(doc(db, 'checkins', 's9_aluno1'), { status: 'validado' });
    });
    await esperar(2500);
    const depois = await medalha('treinos-10');
    expect(depois).toBeDefined();
    expect((depois?.conquistadaEm as Timestamp).isEqual(data)).toBe(true);
    expect(await avisosDeMedalha()).toBe(1);
  });

  test('primeira graduação registra a medalha de graduação', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
      await setDoc(doc(db, 'graduacoes', 'g1'), graduacaoBase('aluno1', 'academia1'));
    });
    await aguardar(async () => (await medalha('graduacoes-1')) !== undefined);
    expect((await medalha('graduacoes-1'))?.origem).toBe('graduacao');
  });

  test('migração: data reconstruída do histórico, sem aviso, e idempotente', async () => {
    process.env.FUNCTIONS_EMULATOR = 'true';
    process.env.GCLOUD_PROJECT = PROJECT_ID;
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { avaliarMedalhas } = require('../../functions/src/index');
    // Mesmo firebase-admin das functions (functions/node_modules), onde o app padrão foi iniciado
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [`${__dirname}/../../functions`] }));

    // 10 validados direto no banco (como dado antigo), sem passar pelo gatilho de validação
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
      for (let i = 0; i < 10; i += 1) {
        const quando = Timestamp.fromMillis(Date.now() - (20 - i) * UM_DIA);
        await setDoc(doc(db, 'checkins', `m${i}_aluno1`), checkinBase(`m${i}`, 'turma1', 'aluno1', 'academia1', {
          status: 'validado', dataHora: quando, validadoEm: quando,
        }));
      }
    });

    const simuladas = await avaliarMedalhas(getFirestore(), 'aluno1', { origem: 'migracao', aplicar: false, notificar: false });
    expect(simuladas.map((m: { id: string }) => m.id)).toEqual(['treinos-10']);
    expect(await medalha('treinos-10')).toBeUndefined();

    await avaliarMedalhas(getFirestore(), 'aluno1', { origem: 'migracao', notificar: false });
    const m = await medalha('treinos-10');
    expect(m?.origem).toBe('migracao');
    // o 10º validado foi há 11 dias
    expect(Math.round((Date.now() - (m?.conquistadaEm as Timestamp).toMillis()) / UM_DIA)).toBe(11);
    expect(await avisosDeMedalha()).toBe(0);

    const segunda = await avaliarMedalhas(getFirestore(), 'aluno1', { origem: 'migracao', notificar: false });
    expect(segunda).toEqual([]);
  });
});
