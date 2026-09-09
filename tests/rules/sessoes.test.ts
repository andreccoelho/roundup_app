import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, type Firestore } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados,
  comoUsuario, semear, usuarioBase, turmaBase, sessaoBase,
  minutosAPartirDeAgora, AGORA,
} from './helpers';
import { listarProximasSessoesDoAluno } from '../../src/services/sessoes';

// Mesma justificativa do limite-acessos.test.ts: src/services/firebase.ts importa
// react-native e inicializa um app real na borda do módulo, incompatível com o Node puro do
// Jest — as funções chamadas aqui sempre recebem `dbInstancia` explícito neste arquivo.
jest.mock('../../src/services/firebase', () => ({ db: {} }));

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

async function semearAtores() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno2'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'turmas', 'turma1'), turmaBase('academia1', 'academia'));
  });
}

describe('sessoes', () => {
  test('responsável cria sessão da própria turma', async () => {
    await semearAtores();
    const dbAcademia = comoUsuario('academia1');
    await assertSucceeds(setDoc(
      doc(dbAcademia, 'sessoes', 'sessao1'),
      sessaoBase('turma1', 'academia1', 'academia1'),
    ));
  });

  test('gestor não responsável pela turma é negado (RN07)', async () => {
    await semearAtores();
    const dbOutraAcademia = comoUsuario('academia2');
    await assertFails(setDoc(
      doc(dbOutraAcademia, 'sessoes', 'sessao1'),
      sessaoBase('turma1', 'academia2', 'academia2'),
    ));
  });

  test('janelaCheckInFim anterior ao início é negada', async () => {
    await semearAtores();
    const dbAcademia = comoUsuario('academia1');
    await assertFails(setDoc(
      doc(dbAcademia, 'sessoes', 'sessao1'),
      sessaoBase('turma1', 'academia1', 'academia1', {
        janelaCheckInInicio: AGORA,
        janelaCheckInFim: AGORA,
      }),
    ));
  });

  test('aluno presente em leitoresIds lê a sessão', async () => {
    await semearAtores();
    await semear(async (db) => {
      await setDoc(doc(db, 'sessoes', 'sessao1'), sessaoBase('turma1', 'academia1', 'academia1', {
        leitoresIds: ['academia1', 'academia1', 'aluno1'],
      }));
    });
    const dbAluno = comoUsuario('aluno1');
    await assertSucceeds(getDoc(doc(dbAluno, 'sessoes', 'sessao1')));
  });

  test('aluno de outra turma da mesma academia não lê (RNF04, LGPD)', async () => {
    await semearAtores();
    await semear(async (db) => {
      // sessao1 é de outra turma da academia1; aluno2 não está em leitoresIds dela
      await setDoc(doc(db, 'sessoes', 'sessao1'), sessaoBase('turma1', 'academia1', 'academia1', {
        leitoresIds: ['academia1', 'aluno1'],
      }));
    });
    const dbAluno2 = comoUsuario('aluno2');
    await assertFails(getDoc(doc(dbAluno2, 'sessoes', 'sessao1')));
  });

  test('a consulta real de agenda com array-contains mais filtro de data passa', async () => {
    await semearAtores();
    await semear(async (db) => {
      await setDoc(doc(db, 'sessoes', 'sessao1'), sessaoBase('turma1', 'academia1', 'academia1', {
        leitoresIds: ['academia1', 'aluno1'],
        inicio: minutosAPartirDeAgora(30),
        fim: minutosAPartirDeAgora(90),
      }));
    });
    const dbAluno = comoUsuario('aluno1') as unknown as Firestore;
    const sessoes = await assertSucceeds(listarProximasSessoesDoAluno('aluno1', dbAluno));
    expect(sessoes).toHaveLength(1);
  });

  test('consulta de sessões sem o filtro array-contains é negada', async () => {
    await semearAtores();
    await semear(async (db) => {
      await setDoc(doc(db, 'sessoes', 'sessao1'), sessaoBase('turma1', 'academia1', 'academia1', {
        leitoresIds: ['academia1', 'aluno1'],
        inicio: minutosAPartirDeAgora(30),
      }));
    });
    const dbAluno = comoUsuario('aluno1');
    // Prova que a restrição vive na regra, não só na consulta que o cliente decide fazer:
    // sem o array-contains == meuId(), o Firestore não consegue provar a consulta segura
    // e nega a consulta inteira, mesmo que o aluno tivesse acesso a ALGUNS resultados.
    await assertFails(getDocs(query(
      collection(dbAluno, 'sessoes'),
      where('inicio', '>=', minutosAPartirDeAgora(0)),
    )));
  });

  // A sincronização de leitoresIds na (des)matrícula saiu do client para uma Cloud Function
  // com Admin SDK (ver docs/decisoes-tecnicas.md e functions/src/index.ts) — o paradoxo de
  // ordem (o aluno precisaria já estar em leitoresIds para poder consultar a sessão que o
  // adicionaria a leitoresIds) não tem solução só com firestore.rules. A permissão abaixo
  // continua na regra (script desta rodada pediu para não alterar firestore.rules), mas hoje
  // só é testada diretamente — nenhum código do app a aciona mais.
  describe('permissão de autoadição/remoção em leitoresIds (não usada pelo client hoje)', () => {
    test('aluno com vínculo pode adicionar o próprio id a leitoresIds de sessão futura', async () => {
      await semearAtores();
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), { responsaveisIds: ['academia1'] });
        await setDoc(doc(db, 'sessoes', 'futura'), sessaoBase('turma1', 'academia1', 'academia1', {
          leitoresIds: ['academia1'],
          inicio: minutosAPartirDeAgora(60),
        }));
      });
      const dbAluno = comoUsuario('aluno1');
      await assertSucceeds(updateDoc(doc(dbAluno, 'sessoes', 'futura'), {
        leitoresIds: arrayUnion('aluno1'),
      }));
    });

    test('aluno sem vínculo não pode se adicionar a leitoresIds', async () => {
      await semearAtores();
      await semear(async (db) => {
        await setDoc(doc(db, 'sessoes', 'futura'), sessaoBase('turma1', 'academia1', 'academia1', {
          leitoresIds: ['academia1'],
          inicio: minutosAPartirDeAgora(60),
        }));
      });
      const dbAluno = comoUsuario('aluno1');
      await assertFails(updateDoc(doc(dbAluno, 'sessoes', 'futura'), {
        leitoresIds: arrayUnion('aluno1'),
      }));
    });

    test('aluno não pode adicionar o id de outra pessoa a leitoresIds', async () => {
      await semearAtores();
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), { responsaveisIds: ['academia1'] });
        await setDoc(doc(db, 'sessoes', 'futura'), sessaoBase('turma1', 'academia1', 'academia1', {
          leitoresIds: ['academia1'],
          inicio: minutosAPartirDeAgora(60),
        }));
      });
      const dbAluno = comoUsuario('aluno1');
      await assertFails(updateDoc(doc(dbAluno, 'sessoes', 'futura'), {
        leitoresIds: arrayUnion('aluno2'),
      }));
    });

    test('aluno pode remover o próprio id de leitoresIds', async () => {
      await semearAtores();
      await semear(async (db) => {
        await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), { responsaveisIds: ['academia1'] });
        await setDoc(doc(db, 'sessoes', 'futura'), sessaoBase('turma1', 'academia1', 'academia1', {
          leitoresIds: ['academia1', 'aluno1'],
          inicio: minutosAPartirDeAgora(60),
        }));
      });
      const dbAluno = comoUsuario('aluno1');
      await assertSucceeds(updateDoc(doc(dbAluno, 'sessoes', 'futura'), {
        leitoresIds: arrayRemove('aluno1'),
      }));
    });
  });
});
