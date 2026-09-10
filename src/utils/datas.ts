// RN08: as regras de segurança comparam request.time com campos gravados como Timestamp;
// os documentos sempre gravam Timestamp, a conversão para Date acontece na borda do service.
import { Timestamp } from 'firebase/firestore';

export function paraTimestamp(data: Date): Timestamp {
  return Timestamp.fromDate(data);
}

export function paraData(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

export function agoraTimestamp(): Timestamp {
  return Timestamp.now();
}

export function formatarDataHora(timestamp: Timestamp): string {
  return timestamp.toDate().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Campos de texto simples "DD/MM/AAAA" (padrão brasileiro) + "HH:MM" — sem biblioteca de date
// picker nesta rodada. new Date(ano, mes-1, dia, hora, minuto) interpreta no fuso LOCAL do
// dispositivo (correto para RN08); nunca new Date(string ISO), que o JS interpreta como UTC
// para strings sem offset.
export function parseDataBr(data: string): Date | null {
  const partesData = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data.trim());
  if (!partesData) return null;

  const [, diaStr, mesStr, anoStr] = partesData;
  const ano = Number(anoStr);
  const mes = Number(mesStr);
  const dia = Number(diaStr);

  if (mes < 1 || mes > 12) return null;

  const resultado = new Date(ano, mes - 1, dia);
  if (Number.isNaN(resultado.getTime())) return null;

  // new Date() "rola" dias inválidos (ex.: 30/02/2026 vira 2 de março) em vez de rejeitar;
  // comparar os componentes de volta detecta esse overflow silencioso
  if (
    resultado.getFullYear() !== ano ||
    resultado.getMonth() !== mes - 1 ||
    resultado.getDate() !== dia
  ) {
    return null;
  }

  return resultado;
}

// Combina uma data (dia/mês/ano já resolvidos, hora zerada) com um horário "HH:MM" em um novo
// Date no fuso local — usada para aplicar o mesmo horário a cada data de uma grade semanal (RF12).
export function combinarDataHora(data: Date, hora: string): Date | null {
  const partesHora = /^(\d{2}):(\d{2})$/.exec(hora.trim());
  if (!partesHora) return null;

  const [, horaStr, minutoStr] = partesHora;
  const horaNum = Number(horaStr);
  const minuto = Number(minutoStr);
  if (horaNum > 23 || minuto > 59) return null;

  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), horaNum, minuto);
}

export function parseDataHora(data: string, hora: string): Date | null {
  const base = parseDataBr(data);
  if (!base) return null;
  return combinarDataHora(base, hora);
}

// RF12: semana (segunda a domingo) que contém `data` — usada para gerar a grade semanal a
// partir de uma única data de referência informada pelo gestor, sem exigir uma data final.
export function semanaContendo(data: Date): { inicio: Date; fim: Date } {
  const diaSemana = data.getDay(); // 0=domingo .. 6=sábado
  const deslocamentoAteSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;

  const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  inicio.setDate(inicio.getDate() + deslocamentoAteSegunda);

  const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  fim.setDate(fim.getDate() + 6);

  return { inicio, fim };
}

// RF12: "sessões recorrentes devem poder ser geradas a partir de uma grade semanal" — enumera,
// dentro de [inicio, fim] (ambos inclusive), uma data para cada dia cujo dia da semana
// (0=domingo .. 6=sábado, igual a Date#getDay()) está em diasSemana.
export function gerarDatasRecorrentes(inicio: Date, fim: Date, diasSemana: number[]): Date[] {
  const datas: Date[] = [];
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const limite = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());

  while (cursor.getTime() <= limite.getTime()) {
    if (diasSemana.includes(cursor.getDay())) {
      datas.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return datas;
}
