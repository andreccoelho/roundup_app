import { calcularProgressoNivel, lerTabelaNiveis, validarConfiguracao } from './gamificacao';

const VALIDOS = { pontosPorCheckin: 10, pontosPorMissao: 30, niveisXp: [100, 250, 450] };

describe('calcularProgressoNivel (RF17, RF33)', () => {
  test('usa a tabela padrão quando nenhuma é passada', () => {
    expect(calcularProgressoNivel(120)).toEqual({ nivel: 2, xpAtual: 20, xpProximoNivel: 150, xpTotal: 120 });
  });

  test('usa a tabela personalizada do responsável', () => {
    expect(calcularProgressoNivel(120, [50, 100, 200])).toEqual({ nivel: 3, xpAtual: 20, xpProximoNivel: 100, xpTotal: 120 });
  });

  test('além do último degrau fica no nível máximo com a barra cheia', () => {
    expect(calcularProgressoNivel(500, [50, 100])).toEqual({ nivel: 3, xpAtual: 1, xpProximoNivel: 1, xpTotal: 500 });
  });
});

describe('lerTabelaNiveis (RF33)', () => {
  test('aceita vírgula, ponto e vírgula e espaços', () => {
    expect(lerTabelaNiveis('100, 250;450  700')).toEqual([100, 250, 450, 700]);
  });

  test('recusa texto vazio ou valor não inteiro', () => {
    expect(lerTabelaNiveis('  ')).toBeNull();
    expect(lerTabelaNiveis('100, abc')).toBeNull();
    expect(lerTabelaNiveis('100, 250.5')).toBeNull();
  });
});

describe('validarConfiguracao (RF33)', () => {
  test('aceita valores dentro dos limites', () => {
    expect(validarConfiguracao(VALIDOS)).toBeNull();
  });

  test('recusa pontos por check-in fora de 1 a 100', () => {
    expect(validarConfiguracao({ ...VALIDOS, pontosPorCheckin: 0 })).toMatch(/check-in/);
    expect(validarConfiguracao({ ...VALIDOS, pontosPorCheckin: 101 })).toMatch(/check-in/);
  });

  test('recusa pontos por missão fora de 0 a 1000', () => {
    expect(validarConfiguracao({ ...VALIDOS, pontosPorMissao: 1001 })).toMatch(/missão/);
  });

  test('recusa tabela de níveis fora de ordem ou com valor repetido', () => {
    expect(validarConfiguracao({ ...VALIDOS, niveisXp: [100, 90] })).toMatch(/crescentes/);
    expect(validarConfiguracao({ ...VALIDOS, niveisXp: [100, 100] })).toMatch(/crescentes/);
  });

  test('recusa tabela vazia', () => {
    expect(validarConfiguracao({ ...VALIDOS, niveisXp: [] })).toMatch(/de 1 a 30/);
  });
});
