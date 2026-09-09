import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, comoUsuario, semear, usuarioBase, AGORA,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

describe('coleções de ciclos posteriores — bloqueadas', () => {
  test('escrita em missoes é negada', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    });
    const db = comoUsuario('academia1');
    await assertFails(setDoc(doc(db, 'missoes', 'missao1'), { titulo: 'x' }));
  });

  test('escrita em graduacoes é negada', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    });
    const db = comoUsuario('academia1');
    await assertFails(setDoc(doc(db, 'graduacoes', 'graduacao1'), { grau: 'x' }));
  });

  test('escrita em configuracoesGamificacao é negada', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    });
    const db = comoUsuario('academia1');
    await assertFails(setDoc(doc(db, 'configuracoesGamificacao', 'config1'), { pontosPorCheckin: 10 }));
  });

  test('consentimentosLGPD aceita criação pelo próprio usuário', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    });
    const db = comoUsuario('aluno1');
    await assertSucceeds(setDoc(doc(db, 'consentimentosLGPD', 'consentimento1'), {
      usuarioId: 'aluno1',
      versao: '1.0',
      aceito: true,
      dataHora: AGORA,
    }));
  });

  test('consentimentosLGPD nega atualização, mesmo pelo próprio usuário', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
      await setDoc(doc(db, 'consentimentosLGPD', 'consentimento1'), {
        usuarioId: 'aluno1',
        versao: '1.0',
        aceito: true,
        dataHora: AGORA,
      });
    });
    const db = comoUsuario('aluno1');
    await assertFails(updateDoc(doc(db, 'consentimentosLGPD', 'consentimento1'), { aceito: false }));
  });
});
