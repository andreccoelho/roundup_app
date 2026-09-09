// Teste de integração: precisa do emulador de Functions RODANDO JUNTO com o de Firestore
// (`npm run test:functions`, que sobe "--only functions,firestore"). As duas Cloud Functions
// em functions/src/index.ts disparam automaticamente quando `semear()` grava/atualiza um
// documento em `matriculas` — o emulador de Firestore não distingue uma escrita feita "com
// as regras desligadas" de uma escrita normal para fins de gatilho.
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, semear,
  usuarioBase, turmaBase, matriculaBase, sessaoBase, minutosAPartirDeAgora,
} from '../rules/helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

// As Cloud Functions rodam de forma assíncrona em reação ao gatilho — não há como "esperar"
// de outro jeito a não ser sondar o resultado esperado com um tempo limite.
async function aguardar(condicao: () => Promise<boolean>, tentativas = 20, intervaloMs = 500): Promise<void> {
  for (let i = 0; i < tentativas; i += 1) {
    if (await condicao()) return;
    await new Promise((resolve) => setTimeout(resolve, intervaloMs));
  }
  throw new Error('Condição não satisfeita a tempo — a Cloud Function não reagiu (ou não está rodando).');
}

async function leitoresDaSessao(sessaoId: string): Promise<string[]> {
  let leitores: string[] = [];
  await semear(async (db) => {
    const snap = await getDoc(doc(db, 'sessoes', sessaoId));
    leitores = (snap.data()?.leitoresIds as string[] | undefined) ?? [];
  });
  return leitores;
}

async function semearCenario(): Promise<void> {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'turmas', 'turma1'), turmaBase('academia1', 'academia'));
    await setDoc(doc(db, 'sessoes', 'sessao1'), sessaoBase('turma1', 'academia1', 'academia1', {
      leitoresIds: ['academia1'],
      inicio: minutosAPartirDeAgora(60),
      status: 'agendada',
    }));
  });
}

describe('sincronizarLeitorNaMatricula / sincronizarLeitorNaAtualizacaoDeMatricula', () => {
  // Este é exatamente o caso que src/services/matriculas.ts sozinho não consegue resolver
  // (ver docs/decisoes-tecnicas.md): sessão futura JÁ EXISTIA antes da matrícula.
  test('matrícula nova adiciona o aluno a leitoresIds de sessão futura pré-existente', async () => {
    await semearCenario();

    await semear(async (db) => {
      await setDoc(doc(db, 'matriculas', 'turma1_aluno1'), matriculaBase('turma1', 'aluno1', 'academia1'));
    });

    await aguardar(async () => (await leitoresDaSessao('sessao1')).includes('aluno1'));
  });

  test('cancelamento de matrícula remove o aluno de leitoresIds da sessão futura', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'matriculas', 'turma1_aluno1'), matriculaBase('turma1', 'aluno1', 'academia1'));
    });
    await aguardar(async () => (await leitoresDaSessao('sessao1')).includes('aluno1'));

    await semear(async (db) => {
      await updateDoc(doc(db, 'matriculas', 'turma1_aluno1'), { status: 'inativa' });
    });

    await aguardar(async () => !(await leitoresDaSessao('sessao1')).includes('aluno1'));
  });

  test('reativar uma matrícula cancelada adiciona o aluno de volta a leitoresIds', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'matriculas', 'turma1_aluno1'), matriculaBase('turma1', 'aluno1', 'academia1', { status: 'inativa' }));
    });

    await semear(async (db) => {
      await updateDoc(doc(db, 'matriculas', 'turma1_aluno1'), { status: 'ativa' });
    });

    await aguardar(async () => (await leitoresDaSessao('sessao1')).includes('aluno1'));
  });

  test('matrícula com status "pendente" (nunca ativa) não adiciona o aluno', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'matriculas', 'turma1_aluno1'), matriculaBase('turma1', 'aluno1', 'academia1', { status: 'inativa' }));
    });

    // dá um tempo razoável para confirmar que NADA acontece, em vez de sondar um evento que não deveria ocorrer
    await new Promise((resolve) => setTimeout(resolve, 2000));
    expect(await leitoresDaSessao('sessao1')).not.toContain('aluno1');
  });
});
