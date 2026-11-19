import { Timestamp } from 'firebase/firestore';
import type { CheckIn, StatusSessao } from '../types';
import {
  calcularMedalhas, calcularProgressoNivel, calcularSequencia, combinarMedalhas, formatarDataConquista, lerTabelaNiveis,
  validarConfiguracao,
} from './gamificacao';

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

describe('calcularSequencia (RF21, por sessão agendada)', () => {
  const AGORA = new Date(2026, 10, 20, 12, 0);
  const diasAtras = (dias: number) => Timestamp.fromDate(new Date(AGORA.getTime() - dias * 24 * 60 * 60 * 1000));
  const sessao = (id: string, dias: number, status: StatusSessao = 'encerrada') => ({ id, status, janelaCheckInFim: diasAtras(dias) });
  const checkin = (sessaoId: string, status: CheckIn['status']) => ({ sessaoId, status } as CheckIn);

  test('conta as sessões validadas mais recentes até a primeira falta', () => {
    const sessoes = [sessao('s1', 1), sessao('s2', 4), sessao('s3', 8), sessao('s4', 10)];
    const checkins = [checkin('s1', 'validado'), checkin('s2', 'validado'), checkin('s4', 'validado')];
    expect(calcularSequencia(sessoes, checkins, AGORA)).toBe(2);
  });

  test('dias sem sessão no meio não quebram a sequência', () => {
    const sessoes = [sessao('s1', 1), sessao('s2', 7), sessao('s3', 14)];
    const checkins = sessoes.map((s) => checkin(s.id, 'validado'));
    expect(calcularSequencia(sessoes, checkins, AGORA)).toBe(3);
  });

  test('sessão cancelada, janela ainda aberta e check-in pendente não quebram', () => {
    const sessoes = [sessao('aberta', -0.1), sessao('cancelada', 1, 'cancelada'), sessao('pendente', 2), sessao('s1', 3)];
    const checkins = [checkin('pendente', 'pendente'), checkin('s1', 'validado')];
    expect(calcularSequencia(sessoes, checkins, AGORA)).toBe(1);
  });

  test('check-in rejeitado quebra', () => {
    const sessoes = [sessao('s1', 1), sessao('s2', 2)];
    expect(calcularSequencia(sessoes, [checkin('s1', 'rejeitado'), checkin('s2', 'validado')], AGORA)).toBe(0);
  });
});

describe('combinarMedalhas (RF19)', () => {
  const conquistadaEm = Timestamp.fromDate(new Date(2026, 9, 12));

  test('medalha registrada pelo servidor vem com a data', () => {
    const [m] = combinarMedalhas(calcularMedalhas(10, 0, 0), [{ id: 'treinos-10', conquistadaEm }]);
    expect(m.conquistada).toBe(true);
    expect(m.conquistadaEm).toEqual(new Date(2026, 9, 12));
    expect(formatarDataConquista(m.conquistadaEm!)).toBe('12/10/2026');
  });

  test('registrada continua conquistada mesmo se a contagem caiu depois (estorno, sequência quebrada)', () => {
    const medalhas = combinarMedalhas(calcularMedalhas(3, 0, 0), [
      { id: 'treinos-10', conquistadaEm }, { id: 'sequencia-7', conquistadaEm },
    ]);
    expect(medalhas.find((m) => m.id === 'treinos-10')?.conquistada).toBe(true);
    expect(medalhas.find((m) => m.id === 'sequencia-7')?.conquistada).toBe(true);
  });

  test('sem registro, vale o cálculo ao vivo, sem data', () => {
    const medalhas = combinarMedalhas(calcularMedalhas(10, 0, 0), []);
    const m = medalhas.find((x) => x.id === 'treinos-10');
    expect(m?.conquistada).toBe(true);
    expect(m?.conquistadaEm).toBeUndefined();
    expect(medalhas.find((x) => x.id === 'treinos-30')?.conquistada).toBe(false);
  });
});
