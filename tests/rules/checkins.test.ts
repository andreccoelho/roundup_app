import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados,
  comoUsuario, semear, usuarioBase, vinculoBase, turmaBase, matriculaBase, sessaoBase, checkinBase,
  minutosAPartirDeAgora, AGORA,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

async function semearAtores(): Promise<void> {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'turmas', 'turma1'), turmaBase('academia1', 'academia'));
    await setDoc(
      doc(db, 'vinculos', 'aluno1_academia1'),
      vinculoBase('aluno1', 'academia1', { tipo: 'aluno-academia', status: 'aceito', respondidoEm: AGORA }),
    );
    await setDoc(doc(db, 'matriculas', 'turma1_aluno1'), matriculaBase('turma1', 'aluno1', 'academia1'));
  });
}

async function semearSessao(id: string, overrides: Record<string, unknown> = {}): Promise<void> {
  await semear(async (db) => {
    await setDoc(doc(db, 'sessoes', id), sessaoBase('turma1', 'academia1', 'academia1', overrides));
  });
}

describe('checkins', () => {
  test('aluno matriculado faz check-in dentro da janela', async () => {
    await semearAtores();
    await semearSessao('sessao1');
    const dbAluno = comoUsuario('aluno1');
    await assertSucceeds(setDoc(
      doc(dbAluno, 'checkins', 'sessao1_aluno1'),
      checkinBase('sessao1', 'turma1', 'aluno1', 'academia1'),
    ));
  });

  test('segundo check-in na mesma sessão é negado (RN02)', async () => {
    await semearAtores();
    await semearSessao('sessao1');
    await semear(async (db) => {
      await setDoc(doc(db, 'checkins', 'sessao1_aluno1'), checkinBase('sessao1', 'turma1', 'aluno1', 'academia1'));
    });
    const dbAluno = comoUsuario('aluno1');
    await assertFails(setDoc(
      doc(dbAluno, 'checkins', 'sessao1_aluno1'),
      checkinBase('sessao1', 'turma1', 'aluno1', 'academia1'),
    ));
  });

  test('check-in antes da janela abrir é negado (RN08)', async () => {
    await semearAtores();
    await semearSessao('sessao1', {
      janelaCheckInInicio: minutosAPartirDeAgora(10),
      janelaCheckInFim: minutosAPartirDeAgora(70),
    });
    const dbAluno = comoUsuario('aluno1');
    await assertFails(setDoc(
      doc(dbAluno, 'checkins', 'sessao1_aluno1'),
      checkinBase('sessao1', 'turma1', 'aluno1', 'academia1'),
    ));
  });

  test('check-in depois da janela fechar é negado (RN08)', async () => {
    await semearAtores();
    await semearSessao('sessao1', {
      janelaCheckInInicio: minutosAPartirDeAgora(-70),
      janelaCheckInFim: minutosAPartirDeAgora(-10),
    });
    const dbAluno = comoUsuario('aluno1');
    await assertFails(setDoc(
      doc(dbAluno, 'checkins', 'sessao1_aluno1'),
      checkinBase('sessao1', 'turma1', 'aluno1', 'academia1'),
    ));
  });

  test('aluno não matriculado é negado', async () => {
    await semearAtores();
    await semearSessao('sessao1');
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno2'), usuarioBase({ perfil: 'aluno' }));
    });
    const dbAluno2 = comoUsuario('aluno2');
    await assertFails(setDoc(
      doc(dbAluno2, 'checkins', 'sessao1_aluno2'),
      checkinBase('sessao1', 'turma1', 'aluno2', 'academia1'),
    ));
  });

  test('check-in com status diferente de "pendente" é negado', async () => {
    await semearAtores();
    await semearSessao('sessao1');
    const dbAluno = comoUsuario('aluno1');
    await assertFails(setDoc(
      doc(dbAluno, 'checkins', 'sessao1_aluno1'),
      checkinBase('sessao1', 'turma1', 'aluno1', 'academia1', { status: 'validado' }),
    ));
  });

  test('check-in com pontos diferente de zero é negado', async () => {
    await semearAtores();
    await semearSessao('sessao1');
    const dbAluno = comoUsuario('aluno1');
    await assertFails(setDoc(
      doc(dbAluno, 'checkins', 'sessao1_aluno1'),
      checkinBase('sessao1', 'turma1', 'aluno1', 'academia1', { pontos: 10 }),
    ));
  });

  test('aluno tenta atualizar o próprio check-in para "validado" é negado (RN01)', async () => {
    await semearAtores();
    await semearSessao('sessao1');
    await semear(async (db) => {
      await setDoc(doc(db, 'checkins', 'sessao1_aluno1'), checkinBase('sessao1', 'turma1', 'aluno1', 'academia1'));
    });
    const dbAluno = comoUsuario('aluno1');
    await assertFails(updateDoc(doc(dbAluno, 'checkins', 'sessao1_aluno1'), { status: 'validado' }));
  });
});
