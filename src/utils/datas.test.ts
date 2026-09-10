// Fixa o fuso em UTC-3 (sem horário de verão desde 2019) para o teste de virada de dia
// não depender do fuso da máquina onde a suíte roda.
process.env.TZ = 'America/Sao_Paulo';

import { parseDataHora, parseDataBr, combinarDataHora, gerarDatasRecorrentes, semanaContendo, paraTimestamp, paraData } from './datas';

describe('parseDataHora', () => {
  test('interpreta a data (DD/MM/AAAA) e a hora no fuso local, não em UTC', () => {
    const resultado = parseDataHora('08/09/2026', '19:00');
    expect(resultado).not.toBeNull();
    expect(resultado!.getFullYear()).toBe(2026);
    expect(resultado!.getMonth()).toBe(8); // setembro, 0-indexed
    expect(resultado!.getDate()).toBe(8);
    expect(resultado!.getHours()).toBe(19);
    expect(resultado!.getMinutes()).toBe(0);
  });

  test('virada de dia: 22:00 local (UTC-3) cai no dia seguinte em UTC, preservando o instante', () => {
    const resultado = parseDataHora('08/09/2026', '22:00');
    expect(resultado).not.toBeNull();
    expect(resultado!.toISOString()).toBe('2026-09-09T01:00:00.000Z');
  });

  test('rejeita dia inexistente em vez de aceitar o rollover silencioso do JS (30/02 em ano não bissexto)', () => {
    expect(parseDataHora('30/02/2026', '10:00')).toBeNull();
  });

  test('rejeita hora fora do intervalo 00–23', () => {
    expect(parseDataHora('08/09/2026', '25:00')).toBeNull();
  });

  test('rejeita minuto fora do intervalo 00–59', () => {
    expect(parseDataHora('08/09/2026', '10:60')).toBeNull();
  });

  test('rejeita mês fora do intervalo 01–12', () => {
    expect(parseDataHora('01/13/2026', '10:00')).toBeNull();
  });

  test('rejeita formato de data ou hora fora do padrão', () => {
    expect(parseDataHora('2026-09-08', '19:00')).toBeNull();
    expect(parseDataHora('08/09/2026', '7pm')).toBeNull();
    expect(parseDataHora('', '')).toBeNull();
  });

  test('paraTimestamp/paraData fazem ida e volta preservando o instante exato', () => {
    const original = parseDataHora('08/09/2026', '19:00')!;
    const devolta = paraData(paraTimestamp(original));
    expect(devolta.getTime()).toBe(original.getTime());
  });
});

describe('parseDataBr', () => {
  test('aceita data no padrão brasileiro DD/MM/AAAA', () => {
    const resultado = parseDataBr('08/09/2026');
    expect(resultado).not.toBeNull();
    expect(resultado!.getFullYear()).toBe(2026);
    expect(resultado!.getMonth()).toBe(8);
    expect(resultado!.getDate()).toBe(8);
  });

  test('rejeita formato ISO (AAAA-MM-DD)', () => {
    expect(parseDataBr('2026-09-08')).toBeNull();
  });
});

describe('gerarDatasRecorrentes', () => {
  test('gera uma data por dia da semana selecionado dentro do período, ex.: terça, quarta e quinta', () => {
    // 07/09/2026 é segunda-feira
    const inicio = parseDataBr('07/09/2026')!;
    const fim = parseDataBr('20/09/2026')!;
    // 2=terça, 3=quarta, 4=quinta (Date#getDay())
    const datas = gerarDatasRecorrentes(inicio, fim, [2, 3, 4]);

    expect(datas).toHaveLength(6);
    expect(datas.map(d => d.getDay())).toEqual([2, 3, 4, 2, 3, 4]);
    expect(datas.map(d => d.getDate())).toEqual([8, 9, 10, 15, 16, 17]);
  });

  test('não gera nenhuma data quando nenhum dia da semana selecionado ocorre no período', () => {
    const inicio = parseDataBr('07/09/2026')!;
    const fim = parseDataBr('07/09/2026')!;
    expect(gerarDatasRecorrentes(inicio, fim, [2])).toHaveLength(0);
  });

  test('inclui o próprio dia de início e o próprio dia de fim quando batem com os dias selecionados', () => {
    const inicio = parseDataBr('07/09/2026')!; // segunda
    const fim = parseDataBr('07/09/2026')!;
    const datas = gerarDatasRecorrentes(inicio, fim, [1]);
    expect(datas).toHaveLength(1);
  });
});

describe('semanaContendo', () => {
  test('retorna segunda a domingo da semana de uma data no meio da semana', () => {
    // 09/09/2026 é quarta-feira
    const { inicio, fim } = semanaContendo(parseDataBr('09/09/2026')!);
    expect(inicio.getDay()).toBe(1);
    expect(fim.getDay()).toBe(0);
    expect(inicio.getDate()).toBe(7);
    expect(fim.getDate()).toBe(13);
  });

  test('domingo pertence à semana que termina nele mesmo, não à seguinte', () => {
    // 13/09/2026 é domingo
    const { inicio, fim } = semanaContendo(parseDataBr('13/09/2026')!);
    expect(inicio.getDate()).toBe(7);
    expect(fim.getDate()).toBe(13);
  });

  test('segunda-feira é ela mesma o início da semana', () => {
    const referencia = parseDataBr('07/09/2026')!;
    const { inicio, fim } = semanaContendo(referencia);
    expect(inicio.getTime()).toBe(referencia.getTime());
    expect(fim.getDate()).toBe(13);
  });
});

describe('combinarDataHora', () => {
  test('aplica o horário informado a uma data já resolvida', () => {
    const data = parseDataBr('08/09/2026')!;
    const resultado = combinarDataHora(data, '19:30')!;
    expect(resultado.getDate()).toBe(8);
    expect(resultado.getHours()).toBe(19);
    expect(resultado.getMinutes()).toBe(30);
  });

  test('rejeita horário fora do formato HH:MM', () => {
    const data = parseDataBr('08/09/2026')!;
    expect(combinarDataHora(data, '7pm')).toBeNull();
  });
});
