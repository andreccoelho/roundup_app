import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
  // realizarCheckIn() lê o próprio checkin DENTRO da transação pra impedir duplicata (RN02) —
  // isso é um get() num documento que ainda não existe na maioria das vezes (primeiro check-in
  // do aluno naquela sessão). Sem o "resource == null ||" na regra, essa leitura era negada e
  // NENHUM primeiro check-in conseguia se completar.
  test('ler um check-in que ainda não existe não é negado (existence check usado por RN02)', async () => {
    await semearAtores();
    await semearSessao('sessao1');
    const dbAluno = comoUsuario('aluno1');
    await assertSucceeds(getDoc(doc(dbAluno, 'checkins', 'sessao1_aluno1')));
  });

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

  // RF22 (adiantado nesta rodada): validarCheckIn() em services/checkins.ts depende exatamente
  // desta permissão — o responsável pela sessão (aqui, a academia) atualiza o check-in que o
  // próprio aluno criou. É a "chamada" do painel do professor/academia.
  test('responsável pela sessão valida o check-in do aluno (RF22, chamada do professor)', async () => {
    await semearAtores();
    await semearSessao('sessao1');
    await semear(async (db) => {
      await setDoc(doc(db, 'checkins', 'sessao1_aluno1'), checkinBase('sessao1', 'turma1', 'aluno1', 'academia1'));
    });
    const dbAcademia = comoUsuario('academia1');
    await assertSucceeds(updateDoc(doc(dbAcademia, 'checkins', 'sessao1_aluno1'), {
      status: 'validado',
      validadoPor: 'academia1',
      validadoEm: AGORA,
    }));
  });

  test('quem não é o responsável pela sessão não valida o check-in de outro aluno', async () => {
    await semearAtores();
    await semearSessao('sessao1');
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'professor2'), usuarioBase({ perfil: 'professor', autonomo: true }));
      await setDoc(doc(db, 'checkins', 'sessao1_aluno1'), checkinBase('sessao1', 'turma1', 'aluno1', 'academia1'));
    });
    const dbProfessor2 = comoUsuario('professor2');
    await assertFails(updateDoc(doc(dbProfessor2, 'checkins', 'sessao1_aluno1'), { status: 'validado' }));
  });
});
