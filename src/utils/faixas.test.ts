// RF33: estrutura de faixas, migração do texto livre e progresso até a próxima graduação
import type { FaixaConfig } from '../types';
import {
  estruturaDaModalidade, estruturaPadrao, faixasDoAluno, idDaFaixa, progressoAteProximaFaixa, resolverGraduacao,
  textoDaFaixa, validarEstrutura,
} from './faixas';

const JJ = estruturaPadrao('Jiu-Jitsu');

describe('estrutura padrão (RF33)', () => {
  test('vem da lista fixa atual: Jiu-Jitsu com 5 faixas e 4 graus cada', () => {
    expect(JJ.map((f) => f.nome)).toEqual(['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta']);
    expect(JJ.map((f) => f.id)).toEqual(['branca', 'azul', 'roxa', 'marrom', 'preta']);
    expect(JJ.map((f) => f.cor)).toEqual(['branca', 'azul', 'roxa', 'marrom', 'preta']);
    expect(JJ.every((f) => f.graus === 4)).toBe(true);
    expect(estruturaPadrao('Judô').every((f) => f.graus === 0)).toBe(true);
    expect(estruturaPadrao('Boxe')).toEqual([]);
  });

  test('a personalização do responsável substitui a padrão só na modalidade dela', () => {
    const propria: FaixaConfig[] = [{ id: 'k1', nome: 'Kruang 1', cor: 'branca', graus: 0 }];
    expect(estruturaDaModalidade({ 'Muay Thai': propria }, 'Muay Thai')).toBe(propria);
    expect(estruturaDaModalidade({ 'Muay Thai': propria }, 'Jiu-Jitsu')).toEqual(JJ);
    expect(estruturaDaModalidade(null, 'Jiu-Jitsu')).toEqual(JJ);
  });

  test('texto gravado segue o formato antigo', () => {
    expect(textoDaFaixa({ nome: 'Roxa' }, 0)).toBe('Faixa roxa');
    expect(textoDaFaixa({ nome: 'Roxa' }, 2)).toBe('Faixa roxa, 2º grau');
  });

  test('id novo sem acento e sem repetir', () => {
    expect(idDaFaixa('Vermelha e Preta')).toBe('vermelha-e-preta');
    expect(idDaFaixa('Azul', ['azul'])).toBe('azul-2');
  });
});

describe('resolverGraduacao: migração do texto livre (RF33)', () => {
  test('pelo registro estruturado: renomear a faixa não tira o aluno dela', () => {
    const renomeada = JJ.map((f) => (f.id === 'roxa' ? { ...f, nome: 'Lilás' } : f));
    const r = resolverGraduacao(renomeada, { faixaId: 'roxa', grau: 3 }, 'Faixa roxa, 3º grau');
    expect(r?.faixa.nome).toBe('Lilás');
    expect(r?.grau).toBe(3);
  });

  test('pelo texto livre, sem diferença de acento ou maiúscula', () => {
    expect(resolverGraduacao(JJ, null, 'Faixa roxa, 2º grau')).toMatchObject({ indice: 2, grau: 2 });
    expect(resolverGraduacao(JJ, null, 'MARROM')).toMatchObject({ indice: 3, grau: 0 });
    expect(resolverGraduacao(estruturaPadrao('Judô'), null, 'faixa amarela')?.faixa.id).toBe('amarela');
  });

  test('casa o nome mais longo e não casa pedaço de palavra', () => {
    const faixas: FaixaConfig[] = [
      { id: 'preta', nome: 'Preta', cor: 'preta', graus: 0 },
      { id: 'vp', nome: 'Vermelha e preta', cor: 'vermelha', graus: 0 },
    ];
    expect(resolverGraduacao(faixas, null, 'Faixa vermelha e preta')?.faixa.id).toBe('vp');
    expect(resolverGraduacao(JJ, null, 'Azulada')).toBeNull();
  });

  test('texto que não casa fica sem faixa (aparece só o texto, sem barra)', () => {
    expect(resolverGraduacao(JJ, null, 'Kruang 5')).toBeNull();
    expect(resolverGraduacao(JJ, { faixaId: 'removida', grau: 1 }, 'Faixa removida')).toBeNull();
  });

  test('grau maior que o da faixa é limitado', () => {
    expect(resolverGraduacao(JJ, null, 'Faixa azul, 6º grau')?.grau).toBe(4);
  });
});

describe('progressoAteProximaFaixa (RF33: graus da faixa atual)', () => {
  test('azul 2º grau de 4: metade, próxima roxa', () => {
    const p = progressoAteProximaFaixa(JJ, resolverGraduacao(JJ, null, 'Faixa azul, 2º grau')!);
    expect(p).toMatchObject({ grau: 2, grausDaFaixa: 4, fracao: 0.5, posicao: 2, total: 5 });
    expect(p.proxima?.nome).toBe('Roxa');
  });

  test('faixa sem graus: barra vazia até a próxima', () => {
    const judo = estruturaPadrao('Judô');
    const p = progressoAteProximaFaixa(judo, resolverGraduacao(judo, null, 'Faixa verde')!);
    expect(p.fracao).toBe(0);
    expect(p.proxima?.nome).toBe('Roxa');
  });

  test('última faixa sem graus: cheia, sem próxima', () => {
    const judo = estruturaPadrao('Judô');
    const p = progressoAteProximaFaixa(judo, resolverGraduacao(judo, null, 'Faixa preta')!);
    expect(p.fracao).toBe(1);
    expect(p.proxima).toBeNull();
  });
});

describe('validarEstrutura (RF33)', () => {
  test('a padrão é válida', () => {
    expect(validarEstrutura(JJ)).toBeNull();
  });

  test('recusa vazia, nome vazio, nome repetido, cor fora da paleta e graus fora de 0 a 10', () => {
    expect(validarEstrutura([])).not.toBeNull();
    expect(validarEstrutura([{ ...JJ[0], nome: ' ' }])).not.toBeNull();
    expect(validarEstrutura([JJ[0], { ...JJ[1], nome: 'BRANCA' }])).not.toBeNull();
    expect(validarEstrutura([{ ...JJ[0], cor: 'rosa' as never }])).not.toBeNull();
    expect(validarEstrutura([{ ...JJ[0], graus: 11 }])).not.toBeNull();
    expect(validarEstrutura([{ ...JJ[0], graus: 1.5 }])).not.toBeNull();
    expect(validarEstrutura(Array.from({ length: 21 }, (_, i) => ({ id: `f${i}`, nome: `F${i}`, cor: 'cinza' as const, graus: 0 })))).not.toBeNull();
  });
});

describe('faixasDoAluno (RF33)', () => {
  test('usa a estrutura de quem registrou; texto sem casamento fica de fora', () => {
    const propria: FaixaConfig[] = [
      { id: 'k1', nome: 'Kruang 1', cor: 'branca', graus: 2 },
      { id: 'k2', nome: 'Kruang 2', cor: 'amarela', graus: 0 },
    ];
    const resultado = faixasDoAluno(
      { 'Muay Thai': 'Faixa kruang 1, 1º grau', 'Jiu-Jitsu': 'Faixa azul', Boxe: 'Não se aplica' },
      { 'Muay Thai': { faixaId: 'k1', faixa: 'Kruang 1', cor: 'branca', grau: 1, responsavelId: 'prof1' } },
      (id) => (id === 'prof1' ? { 'Muay Thai': propria } : null),
      'academia1',
    );
    expect(resultado['Muay Thai']).toMatchObject({ cor: 'branca', graus: 1 });
    expect(resultado['Muay Thai'].progresso.proxima?.nome).toBe('Kruang 2');
    expect(resultado['Jiu-Jitsu'].progresso.proxima?.nome).toBe('Roxa');
    expect(resultado.Boxe).toBeUndefined();
  });
});
