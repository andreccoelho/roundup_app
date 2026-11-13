// RF19: data de conquista de cada marco (functions/src/medalhasRegras.ts), sem emulador
import { datasDeConquista, MARCOS } from '../../functions/src/medalhasRegras';

const DIA = 24 * 60 * 60 * 1000;

function sessoesSeguidas(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: `s${i}`, status: 'encerrada', janelaFimMs: (i + 1) * DIA }));
}

describe('datasDeConquista (RF19)', () => {
  test('treinos-10: data em que o 10º check-in foi validado, na ordem de validação', () => {
    const treinos = Array.from({ length: 12 }, (_, i) => ({ sessaoId: `s${i}`, quandoMs: (12 - i) * DIA }));
    const datas = datasDeConquista(treinos, [], new Map(), [], 100 * DIA);
    expect(datas.get('treinos-10')).toBe(10 * DIA);
    expect(datas.has('treinos-30')).toBe(false);
  });

  test('sequência: a primeira vez que chega a 7, mesmo que quebre e volte a crescer depois', () => {
    const sessoes = sessoesSeguidas(20);
    const status = new Map(sessoes.map((s, i) => [s.id, i === 8 ? 'rejeitado' : 'validado']));
    const treinos = sessoes.filter((_, i) => i !== 8).map((s) => ({ sessaoId: s.id, quandoMs: s.janelaFimMs + 1000 }));
    const datas = datasDeConquista(treinos, sessoes, status, [], 100 * DIA);
    // s0..s6 validadas: a 7ª (s6) completou a sequência
    expect(datas.get('sequencia-7')).toBe(7 * DIA + 1000);
  });

  test('sequência que nunca chegou a 7 não dá medalha', () => {
    const sessoes = sessoesSeguidas(10);
    const status = new Map(sessoes.map((s, i) => [s.id, i % 5 === 4 ? 'rejeitado' : 'validado']));
    const datas = datasDeConquista([], sessoes, status, [], 100 * DIA);
    expect(datas.has('sequencia-7')).toBe(false);
  });

  test('primeira graduação: a mais antiga', () => {
    const datas = datasDeConquista([], [], new Map(), [30 * DIA, 5 * DIA], 100 * DIA);
    expect(datas.get('graduacoes-1')).toBe(5 * DIA);
  });

  test('marcos iguais aos do app (src/config/gamificacao.ts)', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { MARCOS_MEDALHAS } = require('../../src/config/gamificacao');
    expect(MARCOS).toEqual(MARCOS_MEDALHAS);
  });
});
