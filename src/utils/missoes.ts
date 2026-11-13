// RF23: regras de público-alvo e vigência das missões no app. A situação que vale para a segurança
// é a da Cloud Function (functions/src/missoesRegras.ts, mesmas regras — mantenha os dois iguais)
// e da regra do Firestore; aqui ela só organiza a tela (aba "Em curso" x histórico).
import type { Missao, PublicoAlvo, SituacaoMissao } from '../types';
import { parseDataBr } from './datas';

const UM_DIA = 24 * 60 * 60 * 1000;

export const ROTULOS_PUBLICO: Record<PublicoAlvo, string> = {
  todos: 'Todos os alunos',
  turma: 'Uma turma',
  alunos: 'Alunos escolhidos',
};

// Vigência a partir de duas datas "DD/MM/AAAA" (dias inteiros, fuso do aparelho): o início é
// 00:00 do primeiro dia e o fim é 00:00 do dia SEGUINTE ao último, para o último dia valer inteiro.
export function vigenciaDeDatas(inicioTexto: string, fimTexto: string): { inicio: Date; fim: Date } | string {
  const inicio = parseDataBr(inicioTexto);
  const ultimoDia = parseDataBr(fimTexto);
  if (!inicio || !ultimoDia) return 'Escreva as datas de início e fim no formato DD/MM/AAAA.';
  if (ultimoDia < inicio) return 'A data de fim não pode ser antes da data de início.';
  const fim = new Date(ultimoDia.getFullYear(), ultimoDia.getMonth(), ultimoDia.getDate() + 1);
  if (fim.getTime() - inicio.getTime() > 366 * UM_DIA) return 'A vigência pode durar no máximo um ano.';
  return { inicio, fim };
}

function ms(valor: { toMillis(): number } | Date | undefined | null): number | null {
  if (!valor) return null;
  return valor instanceof Date ? valor.getTime() : valor.toMillis();
}

export function situacaoDaMissao(missao: Pick<Missao, 'ativa' | 'vigenciaInicio' | 'vigenciaFim' | 'criadoEm'>, agora: Date = new Date()): SituacaoMissao {
  if (missao.ativa !== true) return 'inativa';
  const inicio = ms(missao.vigenciaInicio) ?? ms(missao.criadoEm as unknown as Date) ?? 0;
  const fim = ms(missao.vigenciaFim) ?? Number.POSITIVE_INFINITY;
  if (agora.getTime() < inicio) return 'agendada';
  if (agora.getTime() >= fim) return 'encerrada';
  return 'vigente';
}

function formatarDia(data: Date): string {
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

// "12/11/2026 a 30/11/2026" (o fim exibido é o último dia, não o instante exclusivo gravado)
export function textoVigencia(missao: Pick<Missao, 'vigenciaInicio' | 'vigenciaFim'>): string | null {
  const inicio = ms(missao.vigenciaInicio);
  const fim = ms(missao.vigenciaFim);
  if (inicio === null || fim === null) return null;
  return `${formatarDia(new Date(inicio))} a ${formatarDia(new Date(fim - 1))}`;
}

export function textoDataBr(data: Date): string {
  return formatarDia(data);
}
