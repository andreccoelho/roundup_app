// Datas no fuso do app. As Cloud Functions rodam em UTC, mas "mês" (RN04) e "dia de treino"
// (RF21, RF31) são os do aluno — fixados em America/Sao_Paulo, o mesmo fuso local do app.
// Módulo sem dependência do Firebase, para ser testado direto pelo Jest.

export const FUSO = 'America/Sao_Paulo';
const UM_DIA = 24 * 60 * 60 * 1000;

// RN04: mesmo "AAAA-MM" de periodoDe() em src/utils/datas.ts
export function periodoDe(data: Date): string {
  return diaLocal(data).slice(0, 7);
}

// "AAAA-MM-DD" no fuso do app
export function diaLocal(data: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(data);
}

// Diferença em horas entre o fuso do app e UTC no instante dado (Brasil: -3, sem horário de verão)
function deslocamentoHoras(data: Date): number {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: FUSO, hour: '2-digit', hourCycle: 'h23' }).format(data);
  const diferenca = Number(partes) - data.getUTCHours();
  return ((diferenca + 36) % 24) - 12;
}

// RF31: [início, fim) do dia local que contém `data`, como instantes UTC
export function limitesDoDia(data: Date): { inicio: Date; fim: Date } {
  const dia = diaLocal(data);
  const meiaNoiteUtc = Date.parse(`${dia}T00:00:00Z`);
  const inicio = new Date(meiaNoiteUtc - deslocamentoHoras(data) * 60 * 60 * 1000);
  return { inicio, fim: new Date(inicio.getTime() + UM_DIA) };
}

// "19:00" no fuso do app
export function horaLocal(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(data);
}

// RF21: maior sequência de dias consecutivos com check-in validado (mesmo critério de dia civil
// de calcularSequencia() no app). A maior, não a atual: uma missão de sequência concluída não
// volta a "em curso" só porque a sequência quebrou depois.
export function maiorSequencia(datas: Date[]): number {
  const dias = [...new Set(datas.map(diaLocal))].sort();
  let maior = 0;
  let atual = 0;
  let anterior: number | null = null;
  for (const dia of dias) {
    const instante = Date.parse(`${dia}T00:00:00Z`);
    atual = anterior !== null && instante - anterior === UM_DIA ? atual + 1 : 1;
    maior = Math.max(maior, atual);
    anterior = instante;
  }
  return maior;
}
