// O banco do app (src/services/firebase.ts, que carrega React Native) é trocado por um vazio: os testes
// que rodam funções reais do app passam o banco de teste por parâmetro.
jest.mock('../../src/services/firebase', () => ({ db: {} }));

import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, documentId, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados,
  comoUsuario, semear, usuarioBase, turmaBase, matriculaBase,
} from './helpers';
import { listarTurmasDoAluno } from '../../src/services/turmas';

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

// RF11: turma excluída (inativa) com matrícula do aluno ainda ativa não pode derrubar a lista do aluno.
// Roda a função real listarTurmasDoAluno() sob as regras reais.
describe('listarTurmasDoAluno com turma excluída (RF11)', () => {
  async function semearTurmas() {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
      await setDoc(doc(db, 'turmas', 'ativa1'), turmaBase('academia1', 'academia', { nome: 'Ativa' }));
      await setDoc(doc(db, 'turmas', 'excluida1'), turmaBase('academia1', 'academia', { nome: 'Excluída', ativa: false }));
      await setDoc(doc(db, 'matriculas', 'ativa1_aluno1'), matriculaBase('ativa1', 'aluno1', 'academia1'));
      await setDoc(doc(db, 'matriculas', 'excluida1_aluno1'), matriculaBase('excluida1', 'aluno1', 'academia1'));
    });
  }

  test('a consulta em lote por documentId é negada por causa da turma inativa (causa do erro)', async () => {
    await semearTurmas();
    await assertFails(getDocs(query(collection(comoUsuario('aluno1'), 'turmas'), where(documentId(), 'in', ['ativa1', 'excluida1']))));
  });

  test('a função devolve só a turma ativa, sem erro de permissão', async () => {
    await semearTurmas();
    const turmas = await listarTurmasDoAluno('aluno1', comoUsuario('aluno1') as any);
    expect(turmas.map((t) => t.nome)).toEqual(['Ativa']);
  });

  test('sem matrícula ativa, lista vazia', async () => {
    await semearTurmas();
    expect(await listarTurmasDoAluno('aluno2', comoUsuario('aluno2') as any)).toEqual([]);
  });
});
