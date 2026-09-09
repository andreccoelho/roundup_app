import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados,
  comoUsuario, semear, usuarioBase, vinculoBase, turmaBase, matriculaBase, vinculosPrivadoBase, AGORA,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

async function semearAtores() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'turmas', 'turma1'), turmaBase('academia1', 'academia'));
  });
}

describe('matriculas', () => {
  test('aluno se matricula em turma de responsável com quem tem vínculo aceito', async () => {
    await semearAtores();
    await semear(async (db) => {
      await setDoc(
        doc(db, 'vinculos', 'aluno1_academia1'),
        vinculoBase('aluno1', 'academia1', { tipo: 'aluno-academia', status: 'aceito', respondidoEm: AGORA }),
      );
      // Fase 1: tenhoVinculoAtivoCom() lê usuarios/{uid}/privado/vinculos, não mais um
      // array na raiz de usuarios — é o que responderSolicitacao() gravaria ao aceitar
      await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
    });
    const dbAluno = comoUsuario('aluno1');
    await assertSucceeds(setDoc(
      doc(dbAluno, 'matriculas', 'turma1_aluno1'),
      matriculaBase('turma1', 'aluno1', 'academia1'),
    ));
  });

  test('matrícula sem vínculo é negada (RN05)', async () => {
    await semearAtores();
    const dbAluno = comoUsuario('aluno1');
    await assertFails(setDoc(
      doc(dbAluno, 'matriculas', 'turma1_aluno1'),
      matriculaBase('turma1', 'aluno1', 'academia1'),
    ));
  });

  test('ID fora do padrão turmaId_alunoId é negado', async () => {
    await semearAtores();
    await semear(async (db) => {
      await setDoc(
        doc(db, 'vinculos', 'aluno1_academia1'),
        vinculoBase('aluno1', 'academia1', { tipo: 'aluno-academia', status: 'aceito', respondidoEm: AGORA }),
      );
    });
    const dbAluno = comoUsuario('aluno1');
    await assertFails(setDoc(
      doc(dbAluno, 'matriculas', 'id-qualquer'),
      matriculaBase('turma1', 'aluno1', 'academia1'),
    ));
  });

  test('gestor de outra academia não lê a matrícula', async () => {
    await semearAtores();
    await semear(async (db) => {
      await setDoc(
        doc(db, 'vinculos', 'aluno1_academia1'),
        vinculoBase('aluno1', 'academia1', { tipo: 'aluno-academia', status: 'aceito', respondidoEm: AGORA }),
      );
      await setDoc(doc(db, 'matriculas', 'turma1_aluno1'), matriculaBase('turma1', 'aluno1', 'academia1'));
    });
    const dbOutraAcademia = comoUsuario('academia2');
    await assertFails(getDoc(doc(dbOutraAcademia, 'matriculas', 'turma1_aluno1')));
  });

  // Fase 1.6: matriculas.create depende de usuarios/{uid}/privado/vinculos, mas isso não
  // deve significar que esse documento vira legível por qualquer um — get()/exists() dentro
  // de firestore.rules não passam pela própria regra de leitura, então o dado continua fechado.
  test('usuário autenticado qualquer não lê o documento privado de vínculos de outro', async () => {
    await semearAtores();
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
    });
    const dbQualquer = comoUsuario('academia2');
    await assertFails(getDoc(doc(dbQualquer, 'usuarios', 'aluno1', 'privado', 'vinculos')));
  });
});
