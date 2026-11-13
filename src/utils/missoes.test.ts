// RF23: vigência e situação das missões no app (mesmas regras de functions/src/missoesRegras.ts)
import { Timestamp } from 'firebase/firestore';
import { situacaoDaMissao, textoVigencia, vigenciaDeDatas } from './missoes';

describe('vigenciaDeDatas (RF23)', () => {
  test('início às 00:00 do primeiro dia e fim às 00:00 do dia seguinte ao último', () => {
    const v = vigenciaDeDatas('10/11/2026', '30/11/2026');
    expect(typeof v).not.toBe('string');
    if (typeof v === 'string') return;
    expect(v.inicio).toEqual(new Date(2026, 10, 10));
    expect(v.fim).toEqual(new Date(2026, 11, 1));
  });

  test('um dia só: começa e termina na mesma data', () => {
    const v = vigenciaDeDatas('10/11/2026', '10/11/2026');
    if (typeof v === 'string') throw new Error(v);
    expect(v.fim.getTime() - v.inicio.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  test('recusa data inválida, fim antes do início e mais de um ano', () => {
    expect(typeof vigenciaDeDatas('31/02/2026', '10/03/2026')).toBe('string');
    expect(typeof vigenciaDeDatas('10/11/2026', '09/11/2026')).toBe('string');
    expect(typeof vigenciaDeDatas('10/11/2026', '11/11/2027')).toBe('string');
    expect(typeof vigenciaDeDatas('10/11/2026', '09/11/2027')).not.toBe('string');
  });
});

describe('situacaoDaMissao (RF23)', () => {
  const inicio = Timestamp.fromDate(new Date(2026, 10, 10));
  const fim = Timestamp.fromDate(new Date(2026, 11, 1));
  const base = { ativa: true, vigenciaInicio: inicio, vigenciaFim: fim, criadoEm: new Date(2026, 10, 1) };

  test('agendada antes do início, vigente no período, encerrada a partir do fim', () => {
    expect(situacaoDaMissao(base, new Date(2026, 10, 9, 23, 59))).toBe('agendada');
    expect(situacaoDaMissao(base, new Date(2026, 10, 10))).toBe('vigente');
    expect(situacaoDaMissao(base, new Date(2026, 10, 30, 23, 59))).toBe('vigente');
    expect(situacaoDaMissao(base, new Date(2026, 11, 1))).toBe('encerrada');
  });

  test('desligada é inativa em qualquer data', () => {
    expect(situacaoDaMissao({ ...base, ativa: false }, new Date(2026, 10, 15))).toBe('inativa');
  });

  test('missão antiga, sem vigência: vigente desde a criação, sem fim', () => {
    const antiga = { ativa: true, criadoEm: new Date(2026, 0, 1) };
    expect(situacaoDaMissao(antiga, new Date(2030, 0, 1))).toBe('vigente');
  });

  test('textoVigencia mostra o último dia, não o instante exclusivo do fim', () => {
    expect(textoVigencia({ vigenciaInicio: inicio, vigenciaFim: fim })).toBe('10/11/2026 a 30/11/2026');
    expect(textoVigencia({})).toBeNull();
  });
});
