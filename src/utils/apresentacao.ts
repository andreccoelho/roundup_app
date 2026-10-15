// Formatação e rótulos só de apresentação (redesign "Noite de luta", docs/DESIGN.md). Nada aqui
// muda dado persistido: traduz enums do Firestore para texto de gente e formata datas para os
// componentes de placar. Os utilitários de data com regra de negócio continuam em utils/datas.ts.
import type { NivelTurma, StatusCheckIn, StatusSessao } from '../types';

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

// "19:30"
export function formatarHora(data: Date): string {
  return `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

// "Hoje", "Amanhã", "Ontem" ou "Qui 17/10".
export function rotuloDia(data: Date, agora: Date = new Date()): string {
  const amanha = new Date(agora);
  amanha.setDate(agora.getDate() + 1);
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  if (mesmoDia(data, agora)) return 'Hoje';
  if (mesmoDia(data, amanha)) return 'Amanhã';
  if (mesmoDia(data, ontem)) return 'Ontem';
  return `${DIAS_CURTOS[data.getDay()]} ${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}`;
}

// "Hoje, 19:30" — substitui o "15/10/2026, 19:30" do toLocaleString em listas.
export function formatarDiaHora(data: Date, agora: Date = new Date()): string {
  return `${rotuloDia(data, agora)}, ${formatarHora(data)}`;
}

// Contagem regressiva curta: "45 s", "12 min", "1 h 05".
export function formatarDuracao(ms: number): string {
  const segundos = Math.max(0, Math.round(ms / 1000));
  if (segundos < 60) return `${segundos} s`;
  const minutos = Math.ceil(segundos / 60);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas >= 24) {
    const dias = Math.floor(horas / 24);
    return dias === 1 ? '1 dia' : `${dias} dias`;
  }
  return `${horas} h ${doisDigitos(resto)}`;
}

export const ROTULO_STATUS_SESSAO: Record<StatusSessao, string> = {
  agendada: 'Agendada',
  aberta: 'Aberta agora',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada',
};

export const ROTULO_NIVEL_TURMA: Record<NivelTurma, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export const ROTULO_STATUS_CHECKIN: Record<StatusCheckIn, string> = {
  pendente: 'Aguardando validação',
  validado: 'Validado',
  rejeitado: 'Rejeitado',
};

// Nível de turma cujo valor no Firestore não está no enum (dado antigo) cai no próprio texto.
export function rotuloNivel(nivel: string): string {
  return ROTULO_NIVEL_TURMA[nivel as NivelTurma] ?? nivel;
}
