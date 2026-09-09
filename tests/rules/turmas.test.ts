import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados,
  comoUsuario, semear, usuarioBase, turmaBase,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

async function semearAtores() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
  });
}

describe('turmas', () => {
  test('gestor cria a própria turma', async () => {
    await semearAtores();
    const dbAcademia = comoUsuario('academia1');
    await assertSucceeds(setDoc(
      doc(dbAcademia, 'turmas', 'turma1'),
      turmaBase('academia1', 'academia'),
    ));
  });

  test('gestor tenta criar turma com responsavelId de outro é negado', async () => {
    await semearAtores();
    const dbAcademia = comoUsuario('academia1');
    await assertFails(setDoc(
      doc(dbAcademia, 'turmas', 'turma1'),
      turmaBase('academia2', 'academia'),
    ));
  });

  test('aluno tenta criar turma é negado', async () => {
    await semearAtores();
    const dbAluno = comoUsuario('aluno1');
    await assertFails(setDoc(
      doc(dbAluno, 'turmas', 'turma1'),
      turmaBase('aluno1', 'academia' as any),
    ));
  });

  // Não é possível checar "aluno tem vínculo aceito com o responsável" numa regra de leitura
  // usada por getDocs(query(...)): get()/exists() combinado com resource.data quebra a
  // avaliação em consultas de lista (ver docs/decisoes-tecnicas.md). Por isso turmas ativas
  // ficam abertas a qualquer autenticado, igual a `usuarios` — é o que viabiliza a descoberta
  // (RF08) antes do vínculo existir, sem exigir um get()/exists() por documento na lista.
  test('qualquer autenticado lê turma ativa, mesmo sem vínculo (descoberta, RF08)', async () => {
    await semearAtores();
    await semear(async (db) => {
      await setDoc(doc(db, 'turmas', 'turma1'), turmaBase('academia1', 'academia'));
    });
    const dbAluno = comoUsuario('aluno1');
    await assertSucceeds(getDoc(doc(dbAluno, 'turmas', 'turma1')));
  });

  test('turma inativa só é lida pelo responsável (RNF04)', async () => {
    await semearAtores();
    await semear(async (db) => {
      await setDoc(doc(db, 'turmas', 'turma1'), turmaBase('academia1', 'academia', { ativa: false }));
    });
    const dbAluno = comoUsuario('aluno1');
    await assertFails(getDoc(doc(dbAluno, 'turmas', 'turma1')));

    const dbAcademia = comoUsuario('academia1');
    await assertSucceeds(getDoc(doc(dbAcademia, 'turmas', 'turma1')));
  });
});
