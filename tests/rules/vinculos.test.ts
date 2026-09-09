import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados,
  comoUsuario, semear, usuarioBase, vinculoBase, AGORA,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

async function semearAtores() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'professor1'), usuarioBase({ perfil: 'professor', autonomo: true }));
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
  });
}

describe('vinculos', () => {
  test('solicitante cria vínculo com ID determinístico correto', async () => {
    await semearAtores();
    const dbAluno = comoUsuario('aluno1');
    await assertSucceeds(setDoc(
      doc(dbAluno, 'vinculos', 'aluno1_academia1'),
      vinculoBase('aluno1', 'academia1', { perfilSolicitante: 'aluno', perfilDestinatario: 'academia', tipo: 'aluno-academia' }),
    ));
  });

  test('ID fora do padrão solicitante_destinatario é negado', async () => {
    await semearAtores();
    const dbAluno = comoUsuario('aluno1');
    await assertFails(setDoc(
      doc(dbAluno, 'vinculos', 'qualquer-coisa'),
      vinculoBase('aluno1', 'academia1', { perfilSolicitante: 'aluno', perfilDestinatario: 'academia', tipo: 'aluno-academia' }),
    ));
  });

  test('RN06: academia como solicitante de professor-academia é negada', async () => {
    await semearAtores();
    const dbAcademia = comoUsuario('academia1');
    await assertFails(setDoc(
      doc(dbAcademia, 'vinculos', 'academia1_professor1'),
      vinculoBase('academia1', 'professor1', { perfilSolicitante: 'academia', perfilDestinatario: 'professor', tipo: 'professor-academia' }),
    ));
  });

  test('destinatário aceita a solicitação', async () => {
    await semearAtores();
    await semear(async (db) => {
      await setDoc(
        doc(db, 'vinculos', 'aluno1_academia1'),
        vinculoBase('aluno1', 'academia1', { perfilSolicitante: 'aluno', perfilDestinatario: 'academia', tipo: 'aluno-academia' }),
      );
    });
    const dbAcademia = comoUsuario('academia1');
    await assertSucceeds(updateDoc(doc(dbAcademia, 'vinculos', 'aluno1_academia1'), {
      status: 'aceito',
      respondidoEm: AGORA,
    }));
  });

  test('terceiro não relacionado não lê o vínculo', async () => {
    await semearAtores();
    await semear(async (db) => {
      await setDoc(
        doc(db, 'vinculos', 'aluno1_academia1'),
        vinculoBase('aluno1', 'academia1', { perfilSolicitante: 'aluno', perfilDestinatario: 'academia', tipo: 'aluno-academia' }),
      );
    });
    const dbTerceiro = comoUsuario('academia2');
    await assertFails(getDoc(doc(dbTerceiro, 'vinculos', 'aluno1_academia1')));
  });
});
