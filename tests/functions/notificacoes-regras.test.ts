// RF31: regras puras das notificações e datas no fuso do app (functions/src/notificacoesRegras.ts
// e functions/src/datas.ts) — sem emulador.
import { diaLocal, limitesDoDia, periodoDe } from '../../functions/src/datas';
import { maiorSequenciaDeSessoes } from '../../functions/src/sequencia';
import { marcosAlcancados, selecionarLembretes, textoLembrete } from '../../functions/src/notificacoesRegras';

// 2026-11-05 22:30 em São Paulo (UTC-3) == 2026-11-06 01:30 UTC
const NOITE = new Date(Date.UTC(2026, 10, 6, 1, 30));

describe('datas no fuso do app', () => {
  test('dia e mês seguem São Paulo, não UTC', () => {
    expect(diaLocal(NOITE)).toBe('2026-11-05');
    expect(periodoDe(new Date(Date.UTC(2026, 10, 1, 1, 0)))).toBe('2026-10');
  });

  test('limitesDoDia vai da meia-noite local à meia-noite seguinte', () => {
    const { inicio, fim } = limitesDoDia(NOITE);
    expect(inicio.toISOString()).toBe('2026-11-05T03:00:00.000Z');
    expect(fim.toISOString()).toBe('2026-11-06T03:00:00.000Z');
  });
});

describe('maiorSequenciaDeSessoes (RF21)', () => {
  const AGORA = 1_000_000;
  const sessao = (id: string, janelaFimMs: number, status = 'encerrada') => ({ id, status, janelaFimMs });

  test('conta sessões validadas seguidas e zera numa falta', () => {
    const sessoes = [sessao('a', 1), sessao('b', 2), sessao('c', 3), sessao('d', 4), sessao('e', 5)];
    const status = new Map([['a', 'validado'], ['b', 'validado'], ['c', 'rejeitado'], ['d', 'validado'], ['e', 'validado']]);
    expect(maiorSequenciaDeSessoes(sessoes, status, AGORA)).toBe(2);
  });

  test('cancelada, janela aberta e check-in pendente não contam nem quebram', () => {
    const sessoes = [sessao('a', 1), sessao('b', 2, 'cancelada'), sessao('c', 3), sessao('d', 4), sessao('e', AGORA + 1)];
    const status = new Map([['a', 'validado'], ['c', 'pendente'], ['d', 'validado']]);
    expect(maiorSequenciaDeSessoes(sessoes, status, AGORA)).toBe(2);
  });

  test('sem sessões, zero', () => {
    expect(maiorSequenciaDeSessoes([], new Map(), AGORA)).toBe(0);
  });
});

describe('marcosAlcancados (RF19)', () => {
  test('lista os marcos de treinos e de sequência já atingidos', () => {
    expect(marcosAlcancados(9, 6)).toEqual([]);
    expect(marcosAlcancados(30, 7).map((m) => m.id)).toEqual(['treinos-10', 'treinos-30', 'sequencia-7']);
  });
});

describe('selecionarLembretes (RF31)', () => {
  const sessao = (hora: number, leitoresIds: string[]) => ({
    inicio: new Date(Date.UTC(2026, 10, 5, hora)),
    leitoresIds,
    responsavelId: 'academia1',
    professorId: 'professor1',
  });

  test('um lembrete por aluno, com a primeira sessão do dia, sem responsável e professor', () => {
    const resultado = selecionarLembretes(
      [sessao(22, ['academia1', 'professor1', 'aluno1', 'aluno2']), sessao(12, ['academia1', 'professor1', 'aluno1'])],
      new Map(),
      '2026-11-05',
    );
    expect([...resultado.keys()].sort()).toEqual(['aluno1', 'aluno2']);
    expect(resultado.get('aluno1')?.getUTCHours()).toBe(12);
  });

  test('quem já recebeu lembrete hoje fica de fora', () => {
    const resultado = selecionarLembretes(
      [sessao(22, ['aluno1', 'aluno2'])],
      new Map([['aluno1', '2026-11-05'], ['aluno2', '2026-11-04']]),
      '2026-11-05',
    );
    expect([...resultado.keys()]).toEqual(['aluno2']);
  });

  test('texto mostra o horário local', () => {
    expect(textoLembrete(new Date(Date.UTC(2026, 10, 5, 22)))).toBe('Você tem treino hoje às 19:00. Não esqueça do check-in.');
  });
});
