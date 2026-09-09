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

// Campos de texto simples "AAAA-MM-DD" + "HH:MM" — sem biblioteca de date picker nesta rodada.
// new Date(ano, mes-1, dia, hora, minuto) interpreta no fuso LOCAL do dispositivo (correto para
// RN08); nunca new Date(string ISO), que o JS interpreta como UTC para strings sem offset.
export function parseDataHora(data: string, hora: string): Date | null {
  const partesData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.trim());
  const partesHora = /^(\d{2}):(\d{2})$/.exec(hora.trim());
  if (!partesData || !partesHora) return null;

  const [, anoStr, mesStr, diaStr] = partesData;
  const [, horaStr, minutoStr] = partesHora;
  const ano = Number(anoStr);
  const mes = Number(mesStr);
  const dia = Number(diaStr);
  const horaNum = Number(horaStr);
  const minuto = Number(minutoStr);

  if (mes < 1 || mes > 12 || horaNum > 23 || minuto > 59) return null;

  const resultado = new Date(ano, mes - 1, dia, horaNum, minuto);
  if (Number.isNaN(resultado.getTime())) return null;

  // new Date() "rola" dias inválidos (ex.: 2026-02-30 vira 2 de março) em vez de rejeitar;
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
