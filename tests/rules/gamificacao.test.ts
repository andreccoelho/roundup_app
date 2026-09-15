// RN01: classificacoes só pode mudar em exatamente ±XP_POR_CHECKIN_VALIDADO (10, hoje) por
// escrita — cobertura da trava de delta pedida depois do achado de que a regra anterior só
// conferia QUEM escrevia, aceitando qualquer valor de pontos.
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, comoUsuario, semear,
  usuarioBase, vinculosPrivadoBase, classificacaoBase,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

async function semearAcademiaComAlunoVinculado() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
  });
}

describe('classificacoes — trava de delta (RN01)', () => {
  test('gestor credita o primeiro XP (create, pontos == 10) é aceito', async () => {
    await semearAcademiaComAlunoVinculado();
    const db = comoUsuario('academia1');
    await assertSucceeds(setDoc(
      doc(db, 'classificacoes', 'aluno1_academia1'),
      classificacaoBase('aluno1', 'academia1', { pontos: 10 }),
    ));
  });

  test('create com pontos diferente de 10 é negado', async () => {
    await semearAcademiaComAlunoVinculado();
    const db = comoUsuario('academia1');
    await assertFails(setDoc(
      doc(db, 'classificacoes', 'aluno1_academia1'),
      classificacaoBase('aluno1', 'academia1', { pontos: 1000 }),
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
      doc(db, 'classificacoes', 'aluno1_academia1'),
      classificacaoBase('aluno1', 'academia1', { pontos: 10 }),
    ));
  });

  test('update com delta de +10 (segundo crédito) é aceito', async () => {
    await semearAcademiaComAlunoVinculado();
    await semear(async (db) => {
      await setDoc(doc(db, 'classificacoes', 'aluno1_academia1'), classificacaoBase('aluno1', 'academia1', { pontos: 10 }));
    });
    const db = comoUsuario('academia1');
    await assertSucceeds(updateDoc(doc(db, 'classificacoes', 'aluno1_academia1'), { pontos: 20 }));
  });

  test('update com delta de -10 (estorno) é aceito', async () => {
    await semearAcademiaComAlunoVinculado();
    await semear(async (db) => {
      await setDoc(doc(db, 'classificacoes', 'aluno1_academia1'), classificacaoBase('aluno1', 'academia1', { pontos: 10 }));
    });
    const db = comoUsuario('academia1');
    await assertSucceeds(updateDoc(doc(db, 'classificacoes', 'aluno1_academia1'), { pontos: 0 }));
  });

  test('update com delta arbitrário (furo de RN01) é negado', async () => {
    await semearAcademiaComAlunoVinculado();
    await semear(async (db) => {
      await setDoc(doc(db, 'classificacoes', 'aluno1_academia1'), classificacaoBase('aluno1', 'academia1', { pontos: 10 }));
    });
    const db = comoUsuario('academia1');
    await assertFails(updateDoc(doc(db, 'classificacoes', 'aluno1_academia1'), { pontos: 999999 }));
  });

  test('update por quem não é o responsável do escopo é negado', async () => {
    await semearAcademiaComAlunoVinculado();
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
      await setDoc(doc(db, 'classificacoes', 'aluno1_academia1'), classificacaoBase('aluno1', 'academia1', { pontos: 10 }));
    });
    const db = comoUsuario('academia2');
    await assertFails(updateDoc(doc(db, 'classificacoes', 'aluno1_academia1'), { pontos: 20 }));
  });
});
