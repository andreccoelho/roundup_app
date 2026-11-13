// RF25, RN03: aplicarGraduacaoNoPerfil (functions/src/graduacoes.ts) projeta o registro imutável do
// professor/academia em usuarios/{alunoId}.graduacoes[modalidade] e atualiza faixaOuGrau. O client
// do professor não escreve no documento do aluno — quem escreve é a function, com o Admin SDK.
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, semear,
  usuarioBase, graduacaoBase,
} from '../rules/helpers';
import { aguardar } from './emuladores';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

jest.setTimeout(30000);

async function perfilDe(uid: string): Promise<Record<string, any> | undefined> {
  let dados: Record<string, any> | undefined;
  await semear(async (db) => {
    dados = (await getDoc(doc(db, 'usuarios', uid))).data();
  });
  return dados;
}

async function semearAluno(extra: Record<string, unknown> = {}): Promise<void> {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno', ...extra }));
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
  });
}

describe('graduação aplicada ao perfil do aluno (RF25, RN03)', () => {
  test('registrar graduação grava a modalidade no mapa e atualiza faixaOuGrau', async () => {
    await semearAluno({ faixaOuGrau: 'Faixa branca', graduacoes: { 'Jiu-Jitsu': 'Faixa branca' } });
    await semear(async (db) => {
      await setDoc(doc(db, 'graduacoes', 'grad1'), graduacaoBase('aluno1', 'academia1', { modalidade: 'Jiu-Jitsu', grau: 'Faixa azul' }));
    });

    await aguardar(async () => (await perfilDe('aluno1'))?.graduacoes?.['Jiu-Jitsu'] === 'Faixa azul');
    const perfil = await perfilDe('aluno1');
    expect(perfil?.faixaOuGrau).toBe('Faixa azul');
    expect(perfil?.perfil).toBe('aluno');
  });

  test('graduar em outra modalidade preserva as já existentes', async () => {
    await semearAluno({ faixaOuGrau: 'Faixa branca', graduacoes: { 'Jiu-Jitsu': 'Faixa branca', Boxe: 'Não se aplica' } });
    await semear(async (db) => {
      await setDoc(doc(db, 'graduacoes', 'grad1'), graduacaoBase('aluno1', 'academia1', { modalidade: 'Muay Thai', grau: 'Faixa amarela' }));
    });

    await aguardar(async () => (await perfilDe('aluno1'))?.graduacoes?.['Muay Thai'] === 'Faixa amarela');
    expect((await perfilDe('aluno1'))?.graduacoes).toEqual({
      'Jiu-Jitsu': 'Faixa branca',
      Boxe: 'Não se aplica',
      'Muay Thai': 'Faixa amarela',
    });
  });

  test('aluno sem mapa anterior (conta antiga) ganha o mapa com a nova graduação', async () => {
    await semearAluno({ faixaOuGrau: 'Faixa roxa' });
    await semear(async (db) => {
      await setDoc(doc(db, 'graduacoes', 'grad1'), graduacaoBase('aluno1', 'academia1', { modalidade: 'Judô', grau: 'Faixa verde' }));
    });

    await aguardar(async () => (await perfilDe('aluno1'))?.graduacoes?.['Judô'] === 'Faixa verde');
    expect((await perfilDe('aluno1'))?.faixaOuGrau).toBe('Faixa verde');
  });

  test('nome de modalidade com ponto é gravado como chave literal, sem criar objeto aninhado', async () => {
    await semearAluno();
    await semear(async (db) => {
      await setDoc(doc(db, 'graduacoes', 'grad1'), graduacaoBase('aluno1', 'academia1', { modalidade: 'Luta Livre 2.0', grau: 'Faixa azul' }));
    });

    await aguardar(async () => (await perfilDe('aluno1'))?.graduacoes?.['Luta Livre 2.0'] === 'Faixa azul');
    expect(Object.keys((await perfilDe('aluno1'))?.graduacoes)).toEqual(['Luta Livre 2.0']);
  });
});

describe('graduação estruturada no perfil do aluno (RF33)', () => {
  test('graduação com faixa da estrutura grava faixasEstruturadas com quem registrou', async () => {
    await semearAluno({ faixaOuGrau: 'Faixa branca', graduacoes: { 'Jiu-Jitsu': 'Faixa branca' } });
    await semear(async (db) => {
      await setDoc(doc(db, 'graduacoes', 'grad1'), graduacaoBase('aluno1', 'academia1', {
        modalidade: 'Jiu-Jitsu', grau: 'Faixa azul, 1º grau', faixaId: 'azul', faixaNome: 'Azul', faixaCor: 'azul', grauNumero: 1,
      }));
    });
    await aguardar(async () => (await perfilDe('aluno1'))?.faixasEstruturadas?.['Jiu-Jitsu'] !== undefined);
    expect((await perfilDe('aluno1'))?.faixasEstruturadas).toEqual({
      'Jiu-Jitsu': { faixaId: 'azul', faixa: 'Azul', cor: 'azul', grau: 1, responsavelId: 'academia1' },
    });
  });

  test('graduação em texto livre (modalidade "Outra") apaga a estruturada daquela modalidade', async () => {
    await semearAluno({
      graduacoes: { Capoeira: 'Corda azul', 'Jiu-Jitsu': 'Faixa azul' },
      faixasEstruturadas: {
        Capoeira: { faixaId: 'azul', faixa: 'Azul', cor: 'azul', grau: 0, responsavelId: 'academia1' },
        'Jiu-Jitsu': { faixaId: 'azul', faixa: 'Azul', cor: 'azul', grau: 0, responsavelId: 'academia1' },
      },
    });
    await semear(async (db) => {
      await setDoc(doc(db, 'graduacoes', 'grad1'), graduacaoBase('aluno1', 'academia1', { modalidade: 'Capoeira', grau: 'Corda verde' }));
    });
    await aguardar(async () => (await perfilDe('aluno1'))?.graduacoes?.Capoeira === 'Corda verde');
    const perfil = await perfilDe('aluno1');
    expect(perfil?.faixasEstruturadas?.Capoeira).toBeUndefined();
    expect(perfil?.faixasEstruturadas?.['Jiu-Jitsu']?.faixaId).toBe('azul');
  });
});
