// RN09, RNF11: teste de integração das Cloud Functions que mantêm `leitoresIds` em
// `classificacoes` (functions/src/classificacao.ts). Mesmo padrão de sincronizacao-leitores:
// grava com as regras desligadas e sonda o efeito assíncrono do gatilho.
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, semear,
  usuarioBase, vinculoBase, classificacaoBase, AGORA,
} from '../rules/helpers';
import { aguardar } from './emuladores';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

jest.setTimeout(30000);

const PERIODO = '2026-11';

async function leitores(id: string): Promise<string[] | undefined> {
  let resultado: string[] | undefined;
  await semear(async (db) => {
    const snap = await getDoc(doc(db, 'classificacoes', id));
    resultado = snap.data()?.leitoresIds;
  });
  return resultado;
}

function ordenados(ids: string[] | undefined): string[] {
  return [...(ids ?? [])].sort();
}

// academia1 com aluno1 e aluno2 vinculados (aceito); aluno3 vinculado só a outra academia
async function semearEscopo(): Promise<void> {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    for (const aluno of ['aluno1', 'aluno2', 'aluno3']) {
      await setDoc(doc(db, 'usuarios', aluno), usuarioBase({ perfil: 'aluno' }));
    }
    for (const aluno of ['aluno1', 'aluno2']) {
      await setDoc(doc(db, 'vinculos', `${aluno}_academia1`), vinculoBase(aluno, 'academia1', {
        tipo: 'aluno-academia', perfilSolicitante: 'aluno', perfilDestinatario: 'academia', status: 'aceito', respondidoEm: AGORA,
      }));
    }
  });
}

async function criarClassificacao(alunoId: string): Promise<string> {
  const id = `${alunoId}_academia1_${PERIODO}`;
  await semear(async (db) => {
    await setDoc(doc(db, 'classificacoes', id), classificacaoBase(alunoId, 'academia1', { periodo: PERIODO, pontos: 10 }));
  });
  return id;
}

describe('leitoresIds de classificacoes (RN09, RNF11)', () => {
  test('documento novo recebe o responsável e os alunos vinculados ao escopo', async () => {
    await semearEscopo();
    const id = await criarClassificacao('aluno1');

    await aguardar(async () => (await leitores(id)) !== undefined);
    expect(ordenados(await leitores(id))).toEqual(['academia1', 'aluno1', 'aluno2']);
  });

  test('RNF11: aluno que não participa fica visível só para si e para o responsável', async () => {
    await semearEscopo();
    await semear(async (db) => {
      await updateDoc(doc(db, 'usuarios', 'aluno1'), { participaClassificacao: false });
    });
    const id = await criarClassificacao('aluno1');

    await aguardar(async () => (await leitores(id)) !== undefined);
    expect(ordenados(await leitores(id))).toEqual(['academia1', 'aluno1']);
  });

  test('RNF11: mudar a preferência no perfil recalcula os leitores', async () => {
    await semearEscopo();
    const id = await criarClassificacao('aluno1');
    await aguardar(async () => (await leitores(id))?.length === 3);

    await semear(async (db) => {
      await updateDoc(doc(db, 'usuarios', 'aluno1'), { participaClassificacao: false });
    });
    await aguardar(async () => (await leitores(id))?.length === 2);
    expect(ordenados(await leitores(id))).toEqual(['academia1', 'aluno1']);

    await semear(async (db) => {
      await updateDoc(doc(db, 'usuarios', 'aluno1'), { participaClassificacao: true });
    });
    await aguardar(async () => (await leitores(id))?.length === 3);
  });

  test('RN09: vínculo novo aceito passa a ler o ranking; vínculo encerrado deixa de ler', async () => {
    await semearEscopo();
    const id = await criarClassificacao('aluno1');
    await aguardar(async () => (await leitores(id))?.length === 3);

    await semear(async (db) => {
      await setDoc(doc(db, 'vinculos', 'aluno3_academia1'), vinculoBase('aluno3', 'academia1', {
        tipo: 'aluno-academia', perfilSolicitante: 'aluno', perfilDestinatario: 'academia', status: 'pendente',
      }));
    });
    await semear(async (db) => {
      await updateDoc(doc(db, 'vinculos', 'aluno3_academia1'), { status: 'aceito', respondidoEm: AGORA });
    });
    await aguardar(async () => (await leitores(id))?.includes('aluno3') === true);

    await semear(async (db) => {
      await updateDoc(doc(db, 'vinculos', 'aluno2_academia1'), { status: 'encerrado' });
    });
    await aguardar(async () => (await leitores(id))?.includes('aluno2') === false);
    expect(ordenados(await leitores(id))).toEqual(['academia1', 'aluno1', 'aluno3']);
  });
});
