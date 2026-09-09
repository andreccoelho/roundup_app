// Fixa o fuso em UTC-3 (sem horário de verão desde 2019) para o teste de virada de dia
// não depender do fuso da máquina onde a suíte roda.
process.env.TZ = 'America/Sao_Paulo';

import { parseDataHora, paraTimestamp, paraData } from './datas';

describe('parseDataHora', () => {
  test('interpreta a data e a hora no fuso local, não em UTC', () => {
    const resultado = parseDataHora('2026-09-08', '19:00');
    expect(resultado).not.toBeNull();
    expect(resultado!.getFullYear()).toBe(2026);
    expect(resultado!.getMonth()).toBe(8); // setembro, 0-indexed
    expect(resultado!.getDate()).toBe(8);
    expect(resultado!.getHours()).toBe(19);
    expect(resultado!.getMinutes()).toBe(0);
  });

  test('virada de dia: 22:00 local (UTC-3) cai no dia seguinte em UTC, preservando o instante', () => {
    const resultado = parseDataHora('2026-09-08', '22:00');
    expect(resultado).not.toBeNull();
    expect(resultado!.toISOString()).toBe('2026-09-09T01:00:00.000Z');
  });

  test('rejeita dia inexistente em vez de aceitar o rollover silencioso do JS (29/02 em ano não bissexto)', () => {
    expect(parseDataHora('2026-02-30', '10:00')).toBeNull();
  });

  test('rejeita hora fora do intervalo 00–23', () => {
    expect(parseDataHora('2026-09-08', '25:00')).toBeNull();
  });

  test('rejeita minuto fora do intervalo 00–59', () => {
    expect(parseDataHora('2026-09-08', '10:60')).toBeNull();
  });

  test('rejeita mês fora do intervalo 01–12', () => {
    expect(parseDataHora('2026-13-01', '10:00')).toBeNull();
  });

  test('rejeita formato de data ou hora fora do padrão', () => {
    expect(parseDataHora('08/09/2026', '19:00')).toBeNull();
    expect(parseDataHora('2026-09-08', '7pm')).toBeNull();
    expect(parseDataHora('', '')).toBeNull();
  });

  test('paraTimestamp/paraData fazem ida e volta preservando o instante exato', () => {
    const original = parseDataHora('2026-09-08', '19:00')!;
    const devolta = paraData(paraTimestamp(original));
    expect(devolta.getTime()).toBe(original.getTime());
  });
});
