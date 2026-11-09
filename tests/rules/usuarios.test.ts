import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, runTransaction, writeBatch, deleteField } from 'firebase/firestore';
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

  describe('RNF04: dados pessoais em usuarios/{uid}/privado/dados', () => {
    const dadosPessoais = { email: 'aluno1@example.com', dataNascimento: AGORA, responsavelLegal: { nome: 'Mãe', contato: 'mae@example.com' } };

    test('o dono lê e grava os próprios dados pessoais', async () => {
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
      });
      const db = comoUsuario('aluno1');
      await assertSucceeds(setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'dados'), dadosPessoais));
      await assertSucceeds(getDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'dados')));
    });

    test('outro usuário autenticado não lê nem grava os dados pessoais', async () => {
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
        await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'dados'), dadosPessoais);
      });
      const dbIntruso = comoUsuario('academia1');
      await assertFails(getDoc(doc(dbIntruso, 'usuarios', 'aluno1', 'privado', 'dados')));
      await assertFails(setDoc(doc(dbIntruso, 'usuarios', 'aluno1', 'privado', 'dados'), { email: 'x@example.com' }));
    });

    test('o documento raiz continua legível por outro autenticado, sem os dados pessoais', async () => {
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
        await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'dados'), dadosPessoais);
      });
      const snap = await assertSucceeds(getDoc(doc(comoUsuario('academia1'), 'usuarios', 'aluno1')));
      expect(snap.data()).not.toHaveProperty('email');
      expect(snap.data()).not.toHaveProperty('dataNascimento');
      expect(snap.data()).not.toHaveProperty('responsavelLegal');
    });

    // Migração no login (buscarMeuUsuario): conta antiga com os campos no raiz move para o privado
    test('o dono migra os campos legados: grava no privado e remove do raiz no mesmo lote', async () => {
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno', ...dadosPessoais }));
      });
      const db = comoUsuario('aluno1');
      const lote = writeBatch(db);
      lote.set(doc(db, 'usuarios', 'aluno1', 'privado', 'dados'), dadosPessoais, { merge: true });
      lote.update(doc(db, 'usuarios', 'aluno1'), { email: deleteField(), dataNascimento: deleteField(), responsavelLegal: deleteField() });
      await assertSucceeds(lote.commit());
      const raiz = await getDoc(doc(db, 'usuarios', 'aluno1'));
      expect(raiz.data()).not.toHaveProperty('email');
      expect(raiz.data()?.perfil).toBe('aluno');
    });

    test.each(['email', 'dataNascimento', 'responsavelLegal'])('criar o documento raiz com %s é negado', async (campo) => {
      const db = comoUsuario('aluno1');
      await assertFails(setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno', [campo]: dadosPessoais[campo as keyof typeof dadosPessoais] })));
      await assertSucceeds(setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' })));
    });
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

    // RF09: contraparte de encerrarVinculo() — inverso do teste acima.
    // souDestinatarioEncerrandoVinculo() exige o ANTES 'aceito' (get()) e o DEPOIS 'encerrado'
    // (getAfter()) na mesma transação.
    test('transação real: encerrar o vínculo e remover do documento privado juntos', async () => {
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
        await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
        await setDoc(
          doc(db, 'vinculos', 'aluno1_academia1'),
          vinculoBase('aluno1', 'academia1', { tipo: 'aluno-academia', status: 'aceito', respondidoEm: AGORA }),
        );
        await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
      });
      const dbAcademia = comoUsuario('academia1');
      await assertSucceeds(runTransaction(dbAcademia, async (transacao) => {
        transacao.update(doc(dbAcademia, 'vinculos', 'aluno1_academia1'), { status: 'encerrado', respondidoEm: AGORA });
        transacao.set(
          doc(dbAcademia, 'usuarios', 'aluno1', 'privado', 'vinculos'),
          { responsaveisIds: arrayRemove('academia1') },
          { merge: true },
        );
      }));
    });

    test('sem vínculo aceito (já encerrado), destinatário não grava mais o documento privado', async () => {
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
        await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
        await setDoc(
          doc(db, 'vinculos', 'aluno1_academia1'),
          vinculoBase('aluno1', 'academia1', { tipo: 'aluno-academia', status: 'encerrado', respondidoEm: AGORA }),
        );
      });
      const dbAcademia = comoUsuario('academia1');
      await assertFails(
        setDoc(doc(dbAcademia, 'usuarios', 'aluno1', 'privado', 'vinculos'), { responsaveisIds: arrayUnion('academia1') }, { merge: true }),
      );
    });
  });

  // RF09, RN06: encerrar um vínculo professor-academia devolve autonomo: true ao professor —
  // inverso do teste de aceite em "RN06: destinatário grava só autonomo/atualizadoEm do
  // professor" (mais acima neste arquivo).
  test('transação real: encerrar vínculo professor-academia devolve autonomo ao professor', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'professor1'), usuarioBase({ perfil: 'professor', autonomo: false }));
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
      await setDoc(
        doc(db, 'vinculos', 'professor1_academia1'),
        vinculoBase('professor1', 'academia1', { perfilSolicitante: 'professor', perfilDestinatario: 'academia', tipo: 'professor-academia', status: 'aceito', respondidoEm: AGORA }),
      );
      await setDoc(doc(db, 'usuarios', 'professor1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
    });
    const dbAcademia = comoUsuario('academia1');
    await assertSucceeds(runTransaction(dbAcademia, async (transacao) => {
      transacao.update(doc(dbAcademia, 'vinculos', 'professor1_academia1'), { status: 'encerrado', respondidoEm: AGORA });
      transacao.set(
        doc(dbAcademia, 'usuarios', 'professor1', 'privado', 'vinculos'),
        { responsaveisIds: arrayRemove('academia1') },
        { merge: true },
      );
      transacao.update(doc(dbAcademia, 'usuarios', 'professor1'), { autonomo: true, atualizadoEm: AGORA });
    }));
  });
});

// RF31: o token de push fica em usuarios/{uid}/privado/notificacoes — o dono grava (registro do
// aparelho no login), ninguém mais lê nem grava. Sem regra nova: é a regra já existente de privado.
describe('usuarios/{uid}/privado/notificacoes (RF31)', () => {
  test('o dono grava e lê o próprio token', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    });
    const db = comoUsuario('aluno1');
    await assertSucceeds(setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'notificacoes'), { tokens: ['ExponentPushToken[x]'] }));
    await assertSucceeds(getDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'notificacoes')));
  });

  test('outro usuário não lê nem grava o token', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'notificacoes'), { tokens: ['ExponentPushToken[x]'] });
    });
    const db = comoUsuario('aluno2');
    await assertFails(getDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'notificacoes')));
    await assertFails(setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'notificacoes'), { tokens: ['ExponentPushToken[intruso]'] }));
  });
});
