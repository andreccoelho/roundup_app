// RN08: os 3 estados visuais que uma sessão pode assumir para o check-in do aluno.
import { Sessao } from '../types';

export type EstadoCheckIn = 'disponivel' | 'foraDaJanela' | 'realizado';

export function estadoCheckIn(sessao: Sessao, jaFezCheckIn: boolean): EstadoCheckIn {
  if (jaFezCheckIn) return 'realizado';

  const agora = new Date();
  const inicio = sessao.janelaCheckInInicio.toDate();
  const fim = sessao.janelaCheckInFim.toDate();
  if (agora < inicio || agora > fim) return 'foraDaJanela';
  return 'disponivel';
}

export function motivoJanelaFechada(sessao: Sessao): string {
  const agora = new Date();
  const inicio = sessao.janelaCheckInInicio.toDate();
  return agora < inicio ? 'Check-in ainda não abriu' : 'Check-in já encerrado';
}
