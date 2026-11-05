// RN01: classificacoes só pode mudar em exatamente ±XP_POR_CHECKIN_VALIDADO (10, hoje) por
// escrita — cobertura da trava de delta pedida depois do achado de que a regra anterior só
// conferia QUEM escrevia, aceitando qualquer valor de pontos.
// RN04: um documento por aluno/responsável/mês (`${alunoId}_${responsavelId}_${periodo}`).
// RN09, RNF11: leitura restrita a aluno, responsável e `leitoresIds` (mantido por Cloud Function).
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, comoUsuario, semear,
  usuarioBase, vinculosPrivadoBase, classificacaoBase,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

const PERIODO = '2026-11';
const ID = `aluno1_academia1_${PERIODO}`;

async function semearAcademiaComAlunoVinculado() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
  });
}

async function semearClassificacao(id: string, dados: Record<string, unknown>) {
  await semear(async (db) => {
    await setDoc(doc(db, 'classificacoes', id), dados);
  });
}

describe('classificacoes — trava de delta (RN01)', () => {
  test('gestor credita o primeiro XP do mês (create, pontos == 10) é aceito', async () => {
    await semearAcademiaComAlunoVinculado();
    const db = comoUsuario('academia1');
    await assertSucceeds(setDoc(
      doc(db, 'classificacoes', ID),
      classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10 }),
    ));
  });

  test('create com pontos diferente de 10 é negado', async () => {
    await semearAcademiaComAlunoVinculado();
    const db = comoUsuario('academia1');
    await assertFails(setDoc(
      doc(db, 'classificacoes', ID),
      classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 1000 }),
    ));
  });

  test('create para aluno sem vínculo aceito é negado (souResponsavelDoAluno)', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
      // sem privado/vinculos
    });
    const db = comoUsuario('academia1');
    await assertFails(setDoc(
      doc(db, 'classificacoes', ID),
      classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10 }),
    ));
  });

  test('update com delta de +10 (segundo crédito) é aceito', async () => {
    await semearAcademiaComAlunoVinculado();
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10 }));
    const db = comoUsuario('academia1');
    await assertSucceeds(updateDoc(doc(db, 'classificacoes', ID), { pontos: 20 }));
  });

  test('update com delta de -10 (estorno) é aceito', async () => {
    await semearAcademiaComAlunoVinculado();
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10 }));
    const db = comoUsuario('academia1');
    await assertSucceeds(updateDoc(doc(db, 'classificacoes', ID), { pontos: 0 }));
  });

  test('update com delta arbitrário (furo de RN01) é negado', async () => {
    await semearAcademiaComAlunoVinculado();
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10 }));
    const db = comoUsuario('academia1');
    await assertFails(updateDoc(doc(db, 'classificacoes', ID), { pontos: 999999 }));
  });

  test('update por quem não é o responsável do escopo é negado', async () => {
    await semearAcademiaComAlunoVinculado();
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
    });
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10 }));
    const db = comoUsuario('academia2');
    await assertFails(updateDoc(doc(db, 'classificacoes', ID), { pontos: 20 }));
  });
});

describe('classificacoes — período (RN04)', () => {
  test('create sem período é negado', async () => {
    await semearAcademiaComAlunoVinculado();
    const db = comoUsuario('academia1');
    await assertFails(setDoc(
      doc(db, 'classificacoes', 'aluno1_academia1'),
      classificacaoBase('aluno1', 'academia1', { pontos: 10 }),
    ));
  });

  test('create com id que não bate com o período gravado é negado', async () => {
    await semearAcademiaComAlunoVinculado();
    const db = comoUsuario('academia1');
    await assertFails(setDoc(
      doc(db, 'classificacoes', 'aluno1_academia1_2026-10'),
      classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10 }),
    ));
  });

  test('create com período em formato inválido é negado', async () => {
    await semearAcademiaComAlunoVinculado();
    const db = comoUsuario('academia1');
    await assertFails(setDoc(
      doc(db, 'classificacoes', 'aluno1_academia1_2026-13'),
      classificacaoBase('aluno1', 'academia1', { periodo: '2026-13', pontos: 10 }),
    ));
  });
});

describe('classificacoes — leitores (RN09, RNF11)', () => {
  test('o gestor não grava leitoresIds na criação', async () => {
    await semearAcademiaComAlunoVinculado();
    const db = comoUsuario('academia1');
    await assertFails(setDoc(
      doc(db, 'classificacoes', ID),
      classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10, leitoresIds: ['academia1', 'intruso'] }),
    ));
  });

  test('o gestor não altera leitoresIds depois', async () => {
    await semearAcademiaComAlunoVinculado();
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10, leitoresIds: ['academia1'] }));
    const db = comoUsuario('academia1');
    await assertFails(updateDoc(doc(db, 'classificacoes', ID), { leitoresIds: ['academia1', 'intruso'] }));
  });

  test('aluno do escopo lista o ranking filtrando por leitoresIds', async () => {
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', {
      periodo: PERIODO, pontos: 10, leitoresIds: ['academia1', 'aluno1', 'aluno2'],
    }));
    const db = comoUsuario('aluno2');
    const snap = await assertSucceeds(getDocs(query(
      collection(db, 'classificacoes'),
      where('responsavelId', '==', 'academia1'),
      where('periodo', '==', PERIODO),
      where('leitoresIds', 'array-contains', 'aluno2'),
    )));
    expect(snap.size).toBe(1);
  });

  test('RN09: consulta do ranking só por responsavelId (sem leitoresIds) é negada', async () => {
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', {
      periodo: PERIODO, pontos: 10, leitoresIds: ['academia1', 'aluno1'],
    }));
    const db = comoUsuario('aluno9');
    await assertFails(getDocs(query(
      collection(db, 'classificacoes'),
      where('responsavelId', '==', 'academia1'),
    )));
  });

  test('RN09: aluno fora de leitoresIds não lê o documento direto', async () => {
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', {
      periodo: PERIODO, pontos: 10, leitoresIds: ['academia1', 'aluno1'],
    }));
    await assertFails(getDoc(doc(comoUsuario('aluno9'), 'classificacoes', ID)));
  });

  test('RNF11: aluno que não participa continua lendo a própria pontuação', async () => {
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', {
      periodo: PERIODO, pontos: 10, leitoresIds: ['academia1', 'aluno1'],
    }));
    const db = comoUsuario('aluno1');
    await assertSucceeds(getDocs(query(collection(db, 'classificacoes'), where('alunoId', '==', 'aluno1'))));
  });

  test('o responsável lê as classificações do próprio escopo', async () => {
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10 }));
    const db = comoUsuario('academia1');
    await assertSucceeds(getDocs(query(collection(db, 'classificacoes'), where('responsavelId', '==', 'academia1'))));
  });
});
