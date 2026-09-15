import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, comoUsuario, semear, usuarioBase, AGORA,
  missaoBase, graduacaoBase,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

describe('coleções de ciclos posteriores — bloqueadas ou com regra real', () => {
  // missoes, graduacoes e classificacoes já têm regra real (ver tests/rules/gamificacao.test.ts
  // para a cobertura completa) — os três testes abaixo continuam aqui só para documentar que um
  // payload BEM FORMADO (com responsavelId, não um objeto incompleto) ainda é negado quando a
  // escrita de fato viola a regra de autorização, não porque falta campo.
  test('gestor tenta criar missao com responsavelId de outro é negado', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
      await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
    });
    const db = comoUsuario('academia1');
    await assertFails(setDoc(doc(db, 'missoes', 'missao1'), missaoBase('academia2')));
  });

  test('gestor tenta criar graduacao para aluno sem vínculo aceito é negado', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
      // Sem usuarios/aluno1/privado/vinculos — sem vínculo aceito com academia1: é isso que
      // souResponsavelDoAluno() checa, não um campo faltando no payload.
    });
    const db = comoUsuario('academia1');
    await assertFails(setDoc(doc(db, 'graduacoes', 'graduacao1'), graduacaoBase('aluno1', 'academia1')));
  });

  test('escrita em configuracoesGamificacao é negada mesmo com payload completo', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    });
    const db = comoUsuario('academia1');
    await assertFails(setDoc(doc(db, 'configuracoesGamificacao', 'config1'), {
      id: 'config1',
      responsavelId: 'academia1',
      pontosPorCheckin: 10,
      pontosPorMissao: 20,
      pontosPorGraduacao: 50,
      atualizadoEm: AGORA,
    }));
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
