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

  // RF08: o solicitante (aluno/professor) também sai do vínculo e pode pedir de novo depois.
  describe('saída pelo solicitante (RF08)', () => {
    const idAluno = 'aluno1_academia1';
    const base = { perfilSolicitante: 'aluno', perfilDestinatario: 'academia', tipo: 'aluno-academia' } as const;

    async function semearVinculo(status: string) {
      await semearAtores();
      await semear(async (db) => {
        await setDoc(doc(db, 'vinculos', idAluno), vinculoBase('aluno1', 'academia1', { ...base, status: status as 'aceito', respondidoEm: AGORA }));
        await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), { responsaveisIds: ['academia1', 'academia2'] });
      });
    }

    test('aluno encerra o próprio vínculo aceito', async () => {
      await semearVinculo('aceito');
      const dbAluno = comoUsuario('aluno1');
      await assertSucceeds(updateDoc(doc(dbAluno, 'vinculos', idAluno), { status: 'encerrado', respondidoEm: AGORA }));
    });

    test('aluno remove o responsável do próprio documento privado', async () => {
      await semearVinculo('aceito');
      const dbAluno = comoUsuario('aluno1');
      await assertSucceeds(setDoc(doc(dbAluno, 'usuarios', 'aluno1', 'privado', 'vinculos'), { responsaveisIds: ['academia2'] }, { merge: true }));
    });

    test('aluno NÃO acrescenta um responsável que ninguém aceitou', async () => {
      await semearVinculo('aceito');
      const dbAluno = comoUsuario('aluno1');
      await assertFails(setDoc(doc(dbAluno, 'usuarios', 'aluno1', 'privado', 'vinculos'), { responsaveisIds: ['academia1', 'academia2', 'academia3'] }, { merge: true }));
    });

    test('aluno não aceita o próprio pedido', async () => {
      await semearVinculo('pendente');
      const dbAluno = comoUsuario('aluno1');
      await assertFails(updateDoc(doc(dbAluno, 'vinculos', idAluno), { status: 'aceito', respondidoEm: AGORA }));
    });

    test('aluno não reabre um vínculo recusado como aceito', async () => {
      await semearVinculo('recusado');
      const dbAluno = comoUsuario('aluno1');
      await assertFails(updateDoc(doc(dbAluno, 'vinculos', idAluno), { status: 'aceito', respondidoEm: AGORA }));
    });

    test('aluno pede de novo depois de encerrado (volta a pendente)', async () => {
      await semearVinculo('encerrado');
      const dbAluno = comoUsuario('aluno1');
      await assertSucceeds(updateDoc(doc(dbAluno, 'vinculos', idAluno), { status: 'pendente', criadoEm: AGORA }));
    });

    test('aluno não troca o destinatário ao pedir de novo', async () => {
      await semearVinculo('recusado');
      const dbAluno = comoUsuario('aluno1');
      await assertFails(updateDoc(doc(dbAluno, 'vinculos', idAluno), { status: 'pendente', destinatarioId: 'academia2' }));
    });
  });

  // RF09: encerrarVinculo() — destinatário encerra um vínculo já aceito.
  describe('encerramento (RF09)', () => {
    test('destinatário encerra um vínculo aceito', async () => {
      await semearAtores();
      await semear(async (db) => {
        await setDoc(
          doc(db, 'vinculos', 'aluno1_academia1'),
          vinculoBase('aluno1', 'academia1', { perfilSolicitante: 'aluno', perfilDestinatario: 'academia', tipo: 'aluno-academia', status: 'aceito', respondidoEm: AGORA }),
        );
      });
      const dbAcademia = comoUsuario('academia1');
      await assertSucceeds(updateDoc(doc(dbAcademia, 'vinculos', 'aluno1_academia1'), {
        status: 'encerrado',
        respondidoEm: AGORA,
      }));
    });

    test('destinatário não pula de pendente direto para encerrado', async () => {
      await semearAtores();
      await semear(async (db) => {
        await setDoc(
          doc(db, 'vinculos', 'aluno1_academia1'),
          vinculoBase('aluno1', 'academia1', { perfilSolicitante: 'aluno', perfilDestinatario: 'academia', tipo: 'aluno-academia', status: 'pendente' }),
        );
      });
      const dbAcademia = comoUsuario('academia1');
      await assertFails(updateDoc(doc(dbAcademia, 'vinculos', 'aluno1_academia1'), {
        status: 'encerrado',
        respondidoEm: AGORA,
      }));
    });

    test('destinatário não reabre um vínculo recusado', async () => {
      await semearAtores();
      await semear(async (db) => {
        await setDoc(
          doc(db, 'vinculos', 'aluno1_academia1'),
          vinculoBase('aluno1', 'academia1', { perfilSolicitante: 'aluno', perfilDestinatario: 'academia', tipo: 'aluno-academia', status: 'recusado', respondidoEm: AGORA }),
        );
      });
      const dbAcademia = comoUsuario('academia1');
      await assertFails(updateDoc(doc(dbAcademia, 'vinculos', 'aluno1_academia1'), {
        status: 'aceito',
        respondidoEm: AGORA,
      }));
    });

    test('não-destinatário não encerra o vínculo', async () => {
      await semearAtores();
      await semear(async (db) => {
        await setDoc(
          doc(db, 'vinculos', 'aluno1_academia1'),
          vinculoBase('aluno1', 'academia1', { perfilSolicitante: 'aluno', perfilDestinatario: 'academia', tipo: 'aluno-academia', status: 'aceito', respondidoEm: AGORA }),
        );
      });
      const dbTerceiro = comoUsuario('academia2');
      await assertFails(updateDoc(doc(dbTerceiro, 'vinculos', 'aluno1_academia1'), {
        status: 'encerrado',
        respondidoEm: AGORA,
      }));
    });
  });
});
