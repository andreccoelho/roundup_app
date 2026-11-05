// RF18: quem escreve missoesProgresso. O aluno nunca escreve o próprio progresso; o responsável
// só escreve progresso de missão personalizada dele, e nunca os campos de crédito de pontos
// (pontosCreditados/periodoCredito), que são da Cloud Function creditarPontosDaMissao.
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, comoUsuario, semear,
  usuarioBase, vinculosPrivadoBase, missaoBase, AGORA,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

function progressoBase(missaoId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `${missaoId}_aluno1`,
    missaoId,
    alunoId: 'aluno1',
    responsavelId: 'academia1',
    progressoAtual: 1,
    concluida: true,
    dataConclusao: AGORA,
    atualizadoEm: AGORA,
    ...overrides,
  };
}

async function semearCenario() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1', 'academia2']));
    await setDoc(doc(db, 'missoes', 'personalizada1'), missaoBase('academia1', { tipo: 'personalizada', meta: 1 }));
    await setDoc(doc(db, 'missoes', 'presenca1'), missaoBase('academia1', { tipo: 'presenca' }));
  });
}

describe('missoesProgresso (RF18)', () => {
  test('aluno não cria o próprio progresso', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('aluno1'), 'missoesProgresso', 'personalizada1_aluno1'), progressoBase('personalizada1')));
  });

  test('aluno não atualiza o próprio progresso', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoesProgresso', 'presenca1_aluno1'), progressoBase('presenca1', { progressoAtual: 1, concluida: false }));
    });
    await assertFails(updateDoc(doc(comoUsuario('aluno1'), 'missoesProgresso', 'presenca1_aluno1'), { progressoAtual: 10, concluida: true }));
  });

  test('responsável marca a conclusão de missão personalizada dele', async () => {
    await semearCenario();
    await assertSucceeds(setDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'personalizada1_aluno1'), progressoBase('personalizada1')));
  });

  test('responsável desmarca a conclusão de missão personalizada', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoesProgresso', 'personalizada1_aluno1'), progressoBase('personalizada1', { pontosCreditados: 10, periodoCredito: '2026-11' }));
    });
    await assertSucceeds(updateDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'personalizada1_aluno1'), {
      concluida: false, progressoAtual: 0, atualizadoEm: AGORA,
    }));
  });

  test('responsável não escreve progresso de missão automática (presença)', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'presenca1_aluno1'), progressoBase('presenca1')));
  });

  test('responsável não grava os campos de crédito de pontos', async () => {
    await semearCenario();
    await assertFails(setDoc(
      doc(comoUsuario('academia1'), 'missoesProgresso', 'personalizada1_aluno1'),
      progressoBase('personalizada1', { pontosCreditados: 0 }),
    ));
    await semear(async (db) => {
      await setDoc(doc(db, 'missoesProgresso', 'personalizada1_aluno1'), progressoBase('personalizada1', { pontosCreditados: 10 }));
    });
    await assertFails(updateDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'personalizada1_aluno1'), { pontosCreditados: 0 }));
  });

  test('outro responsável não marca missão que não é dele, mesmo com vínculo com o aluno', async () => {
    await semearCenario();
    await assertFails(setDoc(
      doc(comoUsuario('academia2'), 'missoesProgresso', 'personalizada1_aluno1'),
      progressoBase('personalizada1', { responsavelId: 'academia2' }),
    ));
  });

  test('id fora do padrão missaoId_alunoId é negado', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'qualquer'), progressoBase('personalizada1')));
  });

  test('ninguém apaga progresso pelo client', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoesProgresso', 'personalizada1_aluno1'), progressoBase('personalizada1'));
    });
    await assertFails(deleteDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'personalizada1_aluno1')));
  });
});
