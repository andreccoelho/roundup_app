import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados,
  comoUsuario, semear, usuarioBase, vinculoBase, vinculosPrivadoBase, AGORA,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

describe('usuarios', () => {
  test('usuário lê o próprio documento', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    });
    const db = comoUsuario('aluno1');
    await assertSucceeds(getDoc(doc(db, 'usuarios', 'aluno1')));
  });

  test('editar documento de terceiro é negado', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    });
    const dbIntruso = comoUsuario('aluno2');
    await assertFails(updateDoc(doc(dbIntruso, 'usuarios', 'aluno1'), { nome: 'Hackeado' }));
  });

  test('tentativa de trocar o próprio perfil é negada', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    });
    const db = comoUsuario('aluno1');
    await assertFails(updateDoc(doc(db, 'usuarios', 'aluno1'), { perfil: 'professor' }));
  });

  test('RN06: academia destinatária de vínculo professor-academia aceito atualiza autonomo do professor', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'professor1'), usuarioBase({ perfil: 'professor', autonomo: true }));
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
      await setDoc(
        doc(db, 'vinculos', 'professor1_academia1'),
        vinculoBase('professor1', 'academia1', { tipo: 'professor-academia', status: 'aceito', respondidoEm: AGORA }),
      );
    });
    const dbAcademia = comoUsuario('academia1');
    await assertSucceeds(
      updateDoc(doc(dbAcademia, 'usuarios', 'professor1'), { autonomo: false, atualizadoEm: AGORA }),
    );
  });

  test('RN06: academia sem vínculo aceito com o professor não atualiza autonomo', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'professor1'), usuarioBase({ perfil: 'professor', autonomo: true }));
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    });
    const dbAcademia = comoUsuario('academia1');
    await assertFails(
      updateDoc(doc(dbAcademia, 'usuarios', 'professor1'), { autonomo: false, atualizadoEm: AGORA }),
    );
  });

  test('RN06: academia com vínculo aceito não pode alterar campos além de autonomo/atualizadoEm', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'professor1'), usuarioBase({ perfil: 'professor', autonomo: true }));
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
      await setDoc(
        doc(db, 'vinculos', 'professor1_academia1'),
        vinculoBase('professor1', 'academia1', { tipo: 'professor-academia', status: 'aceito', respondidoEm: AGORA }),
      );
    });
    const dbAcademia = comoUsuario('academia1');
    await assertFails(
      updateDoc(doc(dbAcademia, 'usuarios', 'professor1'), { autonomo: false, nome: 'Renomeado' }),
    );
  });

  describe('usuarios/{uid}/privado/vinculos (Fase 1)', () => {
    test('dono lê o próprio documento privado de vínculos', async () => {
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
        await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
      });
      const dbAluno = comoUsuario('aluno1');
      await assertSucceeds(getDoc(doc(dbAluno, 'usuarios', 'aluno1', 'privado', 'vinculos')));
    });

    test('qualquer autenticado que não seja o dono não lê o documento privado de outro (RNF04)', async () => {
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
        await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
      });
      const dbIntruso = comoUsuario('aluno2');
      await assertFails(getDoc(doc(dbIntruso, 'usuarios', 'aluno1', 'privado', 'vinculos')));
    });

    test('destinatário de vínculo aceito grava o documento privado do solicitante', async () => {
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
        await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
        await setDoc(
          doc(db, 'vinculos', 'aluno1_academia1'),
          vinculoBase('aluno1', 'academia1', { tipo: 'aluno-academia', status: 'aceito', respondidoEm: AGORA }),
        );
      });
      const dbAcademia = comoUsuario('academia1');
      await assertSucceeds(
        setDoc(doc(dbAcademia, 'usuarios', 'aluno1', 'privado', 'vinculos'), { responsaveisIds: arrayUnion('academia1') }, { merge: true }),
      );
    });

    test('sem vínculo aceito, um terceiro não grava o documento privado de outro', async () => {
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
        await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
      });
      const dbAcademia = comoUsuario('academia1');
      await assertFails(
        setDoc(doc(dbAcademia, 'usuarios', 'aluno1', 'privado', 'vinculos'), { responsaveisIds: arrayUnion('academia1') }, { merge: true }),
      );
    });

    // Reproduz a transação real de responderSolicitacao(): o vínculo muda para 'aceito' e o
    // documento privado é gravado NA MESMA transação. Só passa porque
    // souDestinatarioDeVinculoAceito() usa getAfter()/existsAfter() — um get()/exists() comum
    // só veria o vínculo ainda 'pendente' (estado anterior à transação) e negaria a escrita.
    test('transação real: aceitar o vínculo e gravar o documento privado juntos', async () => {
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
        await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
        await setDoc(
          doc(db, 'vinculos', 'aluno1_academia1'),
          vinculoBase('aluno1', 'academia1', { tipo: 'aluno-academia', status: 'pendente' }),
        );
      });
      const dbAcademia = comoUsuario('academia1');
      await assertSucceeds(runTransaction(dbAcademia, async (transacao) => {
        transacao.update(doc(dbAcademia, 'vinculos', 'aluno1_academia1'), { status: 'aceito', respondidoEm: AGORA });
        transacao.set(
          doc(dbAcademia, 'usuarios', 'aluno1', 'privado', 'vinculos'),
          { responsaveisIds: arrayUnion('academia1') },
          { merge: true },
        );
      }));
    });
  });
});
