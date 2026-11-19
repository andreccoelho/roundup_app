// RF33: estrutura de faixas personalizada (estruturasFaixas/{responsavelId}), graduação estruturada
// no registro (graduacoes) e proteção de usuarios.faixasEstruturadas contra o próprio aluno.
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, comoUsuario, semear,
  usuarioBase, vinculosPrivadoBase, graduacaoBase, AGORA,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

const FAIXAS = [
  { id: 'branca', nome: 'Branca', cor: 'branca', graus: 4 },
  { id: 'azul', nome: 'Azul', cor: 'azul', graus: 4 },
];

function estrutura(responsavelId: string, extra: Record<string, unknown> = {}) {
  return { id: responsavelId, responsavelId, modalidades: { 'Jiu-Jitsu': FAIXAS }, atualizadoEm: AGORA, ...extra };
}

async function semearCenario() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({
      perfil: 'aluno', graduacoes: { 'Jiu-Jitsu': 'Faixa branca' },
      faixasEstruturadas: { 'Jiu-Jitsu': { faixaId: 'branca', faixa: 'Branca', cor: 'branca', grau: 0 } },
    }));
    await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
  });
}

describe('estruturasFaixas (RF33)', () => {
  test('responsável salva e restaura a própria estrutura', async () => {
    await semearCenario();
    const db = comoUsuario('academia1');
    await assertSucceeds(setDoc(doc(db, 'estruturasFaixas', 'academia1'), estrutura('academia1')));
    await assertSucceeds(updateDoc(doc(db, 'estruturasFaixas', 'academia1'), { modalidades: {} }));
  });

  test('ninguém grava a estrutura de outro, e aluno não grava estrutura', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('academia2'), 'estruturasFaixas', 'academia1'), estrutura('academia1')));
    await assertFails(setDoc(doc(comoUsuario('aluno1'), 'estruturasFaixas', 'aluno1'), estrutura('aluno1')));
  });

  test('campo fora do modelo, modalidades que não é mapa ou com mais de 20 modalidades é negado', async () => {
    await semearCenario();
    const db = comoUsuario('academia1');
    await assertFails(setDoc(doc(db, 'estruturasFaixas', 'academia1'), estrutura('academia1', { extra: true })));
    await assertFails(setDoc(doc(db, 'estruturasFaixas', 'academia1'), estrutura('academia1', { modalidades: ['Jiu-Jitsu'] })));
    const muitas = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`M${i}`, FAIXAS]));
    await assertFails(setDoc(doc(db, 'estruturasFaixas', 'academia1'), estrutura('academia1', { modalidades: muitas })));
  });

  test('aluno lê a estrutura do responsável (barra de progresso)', async () => {
    await semearCenario();
    await semear(async (admin) => {
      await setDoc(doc(admin, 'estruturasFaixas', 'academia1'), estrutura('academia1'));
    });
    await assertSucceeds(getDoc(doc(comoUsuario('aluno1'), 'estruturasFaixas', 'academia1')));
  });

  test('aluno não altera a própria faixa estruturada depois do cadastro', async () => {
    await semearCenario();
    await assertFails(updateDoc(doc(comoUsuario('aluno1'), 'usuarios', 'aluno1'), {
      faixasEstruturadas: { 'Jiu-Jitsu': { faixaId: 'preta', faixa: 'Preta', cor: 'preta', grau: 4 } },
    }));
  });

  test('graduação com faixa estruturada: tipos conferidos', async () => {
    await semearCenario();
    const db = comoUsuario('academia1');
    const base = graduacaoBase('aluno1', 'academia1', { faixaId: 'azul', faixaNome: 'Azul', faixaCor: 'azul', grauNumero: 2 });
    await assertSucceeds(setDoc(doc(db, 'graduacoes', 'g1'), base));
    await assertFails(setDoc(doc(db, 'graduacoes', 'g2'), { ...base, grauNumero: 11 }));
    await assertFails(setDoc(doc(db, 'graduacoes', 'g3'), { ...base, grauNumero: 1.5 }));
    await assertFails(setDoc(doc(db, 'graduacoes', 'g4'), { ...base, faixaCor: 'rosa' }));
    await assertFails(setDoc(doc(db, 'graduacoes', 'g5'), { ...base, faixaId: 7 }));
  });
});
