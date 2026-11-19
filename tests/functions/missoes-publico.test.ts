// RF23, RF31: teste de integração de functions/src/missoesPublico.ts — `leitoresIds` da missão
// (público-alvo na vigência, só quem concluiu depois) e aviso de nova missão só para o público.
// O agendamento diário não roda no emulador: o teste chama atualizarSituacaoDasMissoes() direto.
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, Timestamp } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, semear, PROJECT_ID,
  usuarioBase, vinculoBase, missaoBase, matriculaBase, minutosAPartirDeAgora,
} from '../rules/helpers';
import { aguardar } from './emuladores';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

jest.setTimeout(40000);

const UM_DIA = 24 * 60;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ler(caminho: string): Promise<Record<string, any> | undefined> {
  let dados: Record<string, any> | undefined;
  await semear(async (db) => {
    const snap = await getDoc(doc(db, caminho));
    dados = snap.exists() ? snap.data() : undefined;
  });
  return dados;
}

async function avisosDeMissao(uid: string): Promise<number> {
  let total = 0;
  await semear(async (db) => {
    const snap = await getDocs(query(collection(db, 'notificacoes'), where('destinatarioId', '==', uid)));
    total = snap.docs.filter((d) => d.data().tipo === 'novaMissao').length;
  });
  return total;
}

const leitores = async (id: string) => ((await ler(`missoes/${id}`))?.leitoresIds ?? []) as string[];

// aluno1 e aluno2 vinculados à academia1; aluno3 sem vínculo
async function semearCenario(): Promise<void> {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    for (const aluno of ['aluno1', 'aluno2', 'aluno3']) {
      await setDoc(doc(db, 'usuarios', aluno), usuarioBase({ perfil: 'aluno' }));
      await setDoc(doc(db, 'usuarios', aluno, 'privado', 'notificacoes'), { tokens: [`ExponentPushToken[${aluno}]`] });
    }
    for (const aluno of ['aluno1', 'aluno2']) {
      await setDoc(doc(db, 'vinculos', `${aluno}_academia1`), vinculoBase(aluno, 'academia1', {
        tipo: 'aluno-academia', perfilSolicitante: 'aluno', perfilDestinatario: 'academia', status: 'aceito',
      }));
    }
  });
}

describe('público-alvo e vigência das missões (RF23, RF31)', () => {
  test('todos: leitores são os alunos vinculados, e só eles recebem o aviso', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoes', 'm1'), missaoBase('academia1'));
    });
    await aguardar(async () => (await leitores('m1')).length === 2);
    expect(await leitores('m1')).toEqual(['aluno1', 'aluno2']);
    expect((await ler('missoes/m1'))?.situacao).toBe('vigente');
    await aguardar(async () => (await avisosDeMissao('aluno1')) === 1 && (await avisosDeMissao('aluno2')) === 1);
    expect(await avisosDeMissao('aluno3')).toBe(0);
  });

  test('alunos escolhidos: só o escolhido lê e é avisado; uid sem vínculo é ignorado', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoes', 'm1'), missaoBase('academia1', { publicoAlvo: 'alunos', alunosAlvoIds: ['aluno2', 'aluno3'] }));
    });
    await aguardar(async () => (await leitores('m1')).length === 1);
    expect(await leitores('m1')).toEqual(['aluno2']);
    await aguardar(async () => (await avisosDeMissao('aluno2')) === 1);
    await esperar(1000);
    expect(await avisosDeMissao('aluno1')).toBe(0);
    expect(await avisosDeMissao('aluno3')).toBe(0);
  });

  test('turma: entra quem se matricula (e é avisado), sai quem cancela a matrícula', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'matriculas', 'turma1_aluno1'), matriculaBase('turma1', 'aluno1', 'academia1'));
      await setDoc(doc(db, 'missoes', 'm1'), missaoBase('academia1', { publicoAlvo: 'turma', turmaId: 'turma1' }));
    });
    await aguardar(async () => (await leitores('m1')).length === 1);
    expect(await leitores('m1')).toEqual(['aluno1']);

    await semear(async (db) => {
      await setDoc(doc(db, 'matriculas', 'turma1_aluno2'), matriculaBase('turma1', 'aluno2', 'academia1'));
    });
    await aguardar(async () => (await leitores('m1')).length === 2);
    await aguardar(async () => (await avisosDeMissao('aluno2')) === 1);

    await semear(async (db) => {
      await updateDoc(doc(db, 'matriculas', 'turma1_aluno1'), { status: 'inativa' });
    });
    await aguardar(async () => (await leitores('m1')).join() === 'aluno2');
    expect(await avisosDeMissao('aluno1')).toBe(1); // ninguém é avisado duas vezes
  });

  test('vigência futura: ninguém lê nem é avisado até o início; o agendamento diário libera', async () => {
    process.env.FUNCTIONS_EMULATOR = 'true';
    process.env.GCLOUD_PROJECT = PROJECT_ID;
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { atualizarSituacaoDasMissoes } = require('../../functions/src/index');

    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoes', 'm1'), missaoBase('academia1', {
        vigenciaInicio: minutosAPartirDeAgora(UM_DIA), vigenciaFim: minutosAPartirDeAgora(5 * UM_DIA),
      }));
    });
    await aguardar(async () => (await ler('missoes/m1'))?.situacao === 'agendada');
    expect(await leitores('m1')).toEqual([]);
    expect(await avisosDeMissao('aluno1')).toBe(0);

    const amanha = new Date(Date.now() + 25 * 60 * 60 * 1000);
    expect(await atualizarSituacaoDasMissoes(amanha)).toBe(1);
    expect((await ler('missoes/m1'))?.situacao).toBe('vigente');
    expect(await leitores('m1')).toEqual(['aluno1', 'aluno2']);
    await aguardar(async () => (await avisosDeMissao('aluno1')) === 1);

    // Rodar de novo no mesmo dia não muda nada nem avisa outra vez
    expect(await atualizarSituacaoDasMissoes(amanha)).toBe(0);
    await esperar(1000);
    expect(await avisosDeMissao('aluno1')).toBe(1);
  });

  test('depois do fim, só quem concluiu continua lendo a missão', async () => {
    process.env.FUNCTIONS_EMULATOR = 'true';
    process.env.GCLOUD_PROJECT = PROJECT_ID;
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { atualizarSituacaoDasMissoes } = require('../../functions/src/index');

    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoes', 'm1'), missaoBase('academia1', {
        tipo: 'personalizada', meta: 1, pontos: 0,
        vigenciaInicio: minutosAPartirDeAgora(-5 * UM_DIA), vigenciaFim: minutosAPartirDeAgora(UM_DIA),
      }));
    });
    await aguardar(async () => (await leitores('m1')).length === 2);
    await semear(async (db) => {
      await setDoc(doc(db, 'missoesProgresso', 'm1_aluno1'), {
        id: 'm1_aluno1', missaoId: 'm1', alunoId: 'aluno1', responsavelId: 'academia1',
        progressoAtual: 1, concluida: true, atualizadoEm: Timestamp.now(),
      });
    });

    expect(await atualizarSituacaoDasMissoes(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))).toBe(1);
    expect((await ler('missoes/m1'))?.situacao).toBe('encerrada');
    expect(await leitores('m1')).toEqual(['aluno1']);
  });

  test('vínculo encerrado tira o aluno dos leitores', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoes', 'm1'), missaoBase('academia1'));
    });
    await aguardar(async () => (await leitores('m1')).length === 2);
    await semear(async (db) => {
      await updateDoc(doc(db, 'vinculos', 'aluno2_academia1'), { status: 'encerrado' });
    });
    await aguardar(async () => (await leitores('m1')).join() === 'aluno1');
  });
});
