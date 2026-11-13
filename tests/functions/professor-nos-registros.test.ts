// RF22, RF10: functions/src/professorNosRegistros.ts — o servidor grava `professorId` nas matrículas e nos
// check-ins das turmas em que a ACADEMIA atribuiu um professor, e acerta tudo quando a turma muda de professor.
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, semear, PROJECT_ID,
  usuarioBase, turmaBase, matriculaBase, checkinBase,
} from '../rules/helpers';
import { aguardar } from './emuladores';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

jest.setTimeout(40000);

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ler(caminho: string): Promise<Record<string, any> | undefined> {
  let dados: Record<string, any> | undefined;
  await semear(async (db) => {
    const snap = await getDoc(doc(db, caminho));
    dados = snap.exists() ? snap.data() : undefined;
  });
  return dados;
}

async function semearTurmas() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'prof1'), usuarioBase({ perfil: 'professor' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    // atribuída: a academia tem o professor prof1 na turma
    await setDoc(doc(db, 'turmas', 'atribuida'), turmaBase('academia1', 'academia', { professorId: 'prof1' }));
    // sem professor
    await setDoc(doc(db, 'turmas', 'semprofessor'), turmaBase('academia1', 'academia'));
    // professor autônomo: é o próprio responsável (professorId igual ao responsavelId não conta como atribuição)
    await setDoc(doc(db, 'turmas', 'autonoma'), turmaBase('prof1', 'professor', { professorId: 'prof1' }));
  });
}

describe('professorId nos registros da turma (RF22)', () => {
  test('matrícula e check-in novos recebem o professor atribuído; sem atribuição, não', async () => {
    await semearTurmas();
    await semear(async (db) => {
      for (const t of ['atribuida', 'semprofessor', 'autonoma']) {
        await setDoc(doc(db, 'matriculas', `${t}_aluno1`), matriculaBase(t, 'aluno1', t === 'autonoma' ? 'prof1' : 'academia1'));
        await setDoc(doc(db, 'checkins', `s_${t}_aluno1`), checkinBase(`s_${t}`, t, 'aluno1', t === 'autonoma' ? 'prof1' : 'academia1'));
      }
    });
    await aguardar(async () => (await ler('matriculas/atribuida_aluno1'))?.professorId === 'prof1');
    await aguardar(async () => (await ler('checkins/s_atribuida_aluno1'))?.professorId === 'prof1');
    await esperar(1500);
    expect((await ler('matriculas/semprofessor_aluno1'))?.professorId).toBeUndefined();
    expect((await ler('checkins/s_semprofessor_aluno1'))?.professorId).toBeUndefined();
    expect((await ler('matriculas/autonoma_aluno1'))?.professorId).toBeUndefined();
    expect((await ler('checkins/s_autonoma_aluno1'))?.professorId).toBeUndefined();
  });

  test('trocar o professor da turma acerta os registros que já existiam; tirar o professor remove o campo', async () => {
    await semearTurmas();
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'prof2'), usuarioBase({ perfil: 'professor' }));
      await setDoc(doc(db, 'matriculas', 'semprofessor_aluno1'), matriculaBase('semprofessor', 'aluno1', 'academia1'));
      await setDoc(doc(db, 'checkins', 's_semprofessor_aluno1'), checkinBase('s_semprofessor', 'semprofessor', 'aluno1', 'academia1'));
    });
    await esperar(1500);
    expect((await ler('matriculas/semprofessor_aluno1'))?.professorId).toBeUndefined();

    await semear(async (db) => {
      await updateDoc(doc(db, 'turmas', 'semprofessor'), { professorId: 'prof2' });
    });
    await aguardar(async () => (await ler('matriculas/semprofessor_aluno1'))?.professorId === 'prof2');
    await aguardar(async () => (await ler('checkins/s_semprofessor_aluno1'))?.professorId === 'prof2');

    await semear(async (db) => {
      await updateDoc(doc(db, 'turmas', 'semprofessor'), { professorId: 'prof1' });
    });
    await aguardar(async () => (await ler('matriculas/semprofessor_aluno1'))?.professorId === 'prof1');

    const { deleteField } = await import('firebase/firestore');
    await semear(async (db) => {
      await updateDoc(doc(db, 'turmas', 'semprofessor'), { professorId: deleteField() });
    });
    await aguardar(async () => (await ler('matriculas/semprofessor_aluno1'))?.professorId === undefined);
    await aguardar(async () => (await ler('checkins/s_semprofessor_aluno1'))?.professorId === undefined);
  });

  test('migração: reconciliarProfessorDaTurma acerta os registros antigos e é idempotente', async () => {
    process.env.FUNCTIONS_EMULATOR = 'true';
    process.env.GCLOUD_PROJECT = PROJECT_ID;
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { reconciliarProfessorDaTurma } = require('../../functions/src/index');
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [`${__dirname}/../../functions`] }));

    await semearTurmas();
    // registros "antigos": gravados direto, sem passar pelo gatilho (a turma ainda não tinha professor)
    await semear(async (db) => {
      await setDoc(doc(db, 'matriculas', 'atribuida_aluno1'), matriculaBase('atribuida', 'aluno1', 'academia1'));
      await setDoc(doc(db, 'checkins', 's_atribuida_aluno1'), checkinBase('s_atribuida', 'atribuida', 'aluno1', 'academia1'));
    });
    // o gatilho de criação também roda; espera ele terminar e apaga o campo para simular o dado antigo
    await aguardar(async () => (await ler('matriculas/atribuida_aluno1'))?.professorId === 'prof1');
    await aguardar(async () => (await ler('checkins/s_atribuida_aluno1'))?.professorId === 'prof1');
    const { deleteField } = await import('firebase/firestore');
    await semear(async (db) => {
      await updateDoc(doc(db, 'matriculas', 'atribuida_aluno1'), { professorId: deleteField() });
      await updateDoc(doc(db, 'checkins', 's_atribuida_aluno1'), { professorId: deleteField() });
    });

    expect(await reconciliarProfessorDaTurma(getFirestore(), 'atribuida')).toBe(2);
    expect((await ler('matriculas/atribuida_aluno1'))?.professorId).toBe('prof1');
    expect((await ler('checkins/s_atribuida_aluno1'))?.professorId).toBe('prof1');
    expect(await reconciliarProfessorDaTurma(getFirestore(), 'atribuida')).toBe(0);
  });
});
