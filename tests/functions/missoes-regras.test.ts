// RF23: regras puras de público-alvo e vigência (functions/src/missoesRegras.ts), sem emulador
import {
  dentroDaVigencia, leitoresDaMissao, publicoDaMissao, situacaoDaMissao,
} from '../../functions/src/missoesRegras';

const DIA = 24 * 60 * 60 * 1000;

describe('missoesRegras (RF23)', () => {
  const vigente = { ativa: true, vigenciaInicioMs: 10 * DIA, vigenciaFimMs: 20 * DIA };

  test('situação: agendada, vigente, encerrada e inativa', () => {
    expect(situacaoDaMissao(vigente, 9 * DIA)).toBe('agendada');
    expect(situacaoDaMissao(vigente, 10 * DIA)).toBe('vigente');
    expect(situacaoDaMissao(vigente, 20 * DIA - 1)).toBe('vigente');
    expect(situacaoDaMissao(vigente, 20 * DIA)).toBe('encerrada');
    expect(situacaoDaMissao({ ...vigente, ativa: false }, 15 * DIA)).toBe('inativa');
  });

  test('missão antiga: vigente desde a criação, sem fim', () => {
    const antiga = { ativa: true, criadoEmMs: 5 * DIA };
    expect(situacaoDaMissao(antiga, 4 * DIA)).toBe('agendada');
    expect(situacaoDaMissao(antiga, 1000 * DIA)).toBe('vigente');
    expect(dentroDaVigencia(antiga, 1000 * DIA)).toBe(true);
  });

  test('público é sempre restrito aos vinculados', () => {
    const vinculados = ['a', 'b', 'c'];
    expect(publicoDaMissao({}, vinculados, [])).toEqual(['a', 'b', 'c']);
    expect(publicoDaMissao({ publicoAlvo: 'turma', turmaId: 't' }, vinculados, ['b', 'x'])).toEqual(['b']);
    expect(publicoDaMissao({ publicoAlvo: 'alunos', alunosAlvoIds: ['c', 'x'] }, vinculados, [])).toEqual(['c']);
  });

  test('leitores: o público na vigência; fora dela, só quem concluiu', () => {
    expect(leitoresDaMissao('vigente', ['a', 'b'], [])).toEqual(['a', 'b']);
    expect(leitoresDaMissao('encerrada', ['a', 'b'], ['b', 'x'])).toEqual(['b']);
    expect(leitoresDaMissao('agendada', ['a', 'b'], [])).toEqual([]);
    expect(leitoresDaMissao('inativa', ['a', 'b'], ['a'])).toEqual(['a']);
  });
});
