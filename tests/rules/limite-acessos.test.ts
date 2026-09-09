// Teste de regressão: a regra de leitura de `sessoes` hoje é puramente `resource.data`
// (meuId() in leitoresIds), sem get()/exists() nenhum — por isso nem o limite de 10 acessos
// por consulta nem a ausência de cache entre documentos (ver docs/decisoes-tecnicas.md) importam
// mais para este caminho. Este teste semeia dez sessões de dez turmas diferentes, todas com o
// aluno em leitoresIds, e roda a consulta real de listarProximasSessoesDoAluno(): se alguém
// reintroduzir uma checagem cruzada de coleção (get()/exists()) na regra de leitura de
// `sessoes`, este teste é o primeiro a estourar, em vez de falhar silenciosamente em produção.
//
// `src/services/firebase.ts` importa `react-native` e inicializa um app Firebase real na
// borda do módulo — incompatível com o ambiente Node puro do Jest e desnecessário aqui,
// já que listarProximasSessoesDoAluno() sempre recebe `dbInstancia` explícito neste teste.
jest.mock('../../src/services/firebase', () => ({ db: {} }));

import { assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, type Firestore } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados,
  comoUsuario, semear, usuarioBase, turmaBase, matriculaBase, sessaoBase,
  minutosAPartirDeAgora,
} from './helpers';
import { listarProximasSessoesDoAluno } from '../../src/services/sessoes';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

const QUANTIDADE = 10;

test('lista dez sessões de dez turmas da mesma academia sem estourar o limite de acessos', async () => {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));

    for (let i = 1; i <= QUANTIDADE; i += 1) {
      const turmaId = `turma${i}`;
      await setDoc(doc(db, 'turmas', turmaId), turmaBase('academia1', 'academia'));
      await setDoc(doc(db, 'matriculas', `${turmaId}_aluno1`), matriculaBase(turmaId, 'aluno1', 'academia1'));
      await setDoc(
        doc(db, 'sessoes', `sessao${i}`),
        sessaoBase(turmaId, 'academia1', 'academia1', {
          leitoresIds: ['academia1', 'aluno1'],
          inicio: minutosAPartirDeAgora(30 + i),
          fim: minutosAPartirDeAgora(90 + i),
          janelaCheckInInicio: minutosAPartirDeAgora(i),
          janelaCheckInFim: minutosAPartirDeAgora(90 + i),
        }),
      );
    }
  });

  // rules-unit-testing carrega sua própria cópia de @firebase/firestore: em runtime é a
  // mesma API modular, mas o TypeScript enxerga dois tipos `Firestore` nominalmente distintos
  const dbAluno = comoUsuario('aluno1') as unknown as Firestore;
  const sessoes = await assertSucceeds(listarProximasSessoesDoAluno('aluno1', dbAluno));
  expect(sessoes).toHaveLength(QUANTIDADE);
});
