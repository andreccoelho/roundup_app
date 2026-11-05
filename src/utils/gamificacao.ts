// RF17, RF19, RF21: nível/progresso, medalhas e sequência — todos calculados a partir de dados
// que o aluno já pode ler (checkins próprios, graduações próprias), sem coleção nova. Valores
// de configuração em src/config/gamificacao.ts são PROVISÓRIOS — ver docs/DECISOES_PENDENTES.md.
import { CheckIn } from '../types';
import { LIMITES_CONFIGURACAO, MARCOS_MEDALHAS, MarcoMedalha, NIVEIS_XP } from '../config/gamificacao';
import type { Sessao } from '../types';

export interface ProgressoNivel {
  nivel: number;
  xpAtual: number; // progresso dentro do nível atual
  xpProximoNivel: number; // total necessário para completar o nível atual
  xpTotal: number;
}

// RF17: nível atual, pontos acumulados e quanto falta para o próximo nível
// RF33: `niveis` vem da configuração do responsável (ver buscarNiveisDoAluno); sem ela, a tabela padrão
export function calcularProgressoNivel(pontosTotais: number, niveis: readonly number[] = NIVEIS_XP): ProgressoNivel {
  let nivel = 1;
  let baseNivel = 0;

  for (const limiar of niveis) {
    if (pontosTotais < limiar) {
      return { nivel, xpAtual: pontosTotais - baseNivel, xpProximoNivel: limiar - baseNivel, xpTotal: pontosTotais };
    }
    nivel += 1;
    baseNivel = limiar;
  }

  // Além do último degrau da tabela: nível máximo provisório, barra sempre cheia.
  return { nivel, xpAtual: 1, xpProximoNivel: 1, xpTotal: pontosTotais };
}

// RF21: treinos consecutivos contados por SESSÃO agendada do aluno, da mais recente para trás. A
// sequência só quebra numa sessão dele (estava em leitoresIds) cuja janela de check-in já fechou
// sem presença validada — dia sem aula não quebra nada. Não contam nem quebram: sessão cancelada,
// sessão com a janela ainda aberta (o aluno ainda pode chegar) e check-in pendente de validação
// (o professor ainda vai fazer a chamada). Duas sessões no mesmo dia contam 2.
// Mesmo critério de maiorSequenciaDeSessoes() em functions/src/sequencia.ts — mantenha os dois iguais.
export function calcularSequencia(
  sessoes: Pick<Sessao, 'id' | 'status' | 'janelaCheckInFim'>[],
  checkins: CheckIn[],
  agora: Date = new Date(),
): number {
  const statusPorSessao = new Map(checkins.map((c) => [c.sessaoId, c.status]));
  const maisRecentesPrimeiro = sessoes
    .filter((s) => s.status !== 'cancelada')
    .sort((a, b) => b.janelaCheckInFim.toMillis() - a.janelaCheckInFim.toMillis());

  let sequencia = 0;
  for (const sessao of maisRecentesPrimeiro) {
    const status = statusPorSessao.get(sessao.id);
    if (status === 'validado') {
      sequencia += 1;
    } else if (sessao.janelaCheckInFim.toDate() > agora || status === 'pendente') {
      continue;
    } else {
      break;
    }
  }
  return sequencia;
}

export interface MedalhaComEstado extends MarcoMedalha {
  conquistada: boolean;
}

// RF19: marcos calculados ao vivo, sem coleção de medalhas persistida (ver
// src/config/gamificacao.ts)
export function calcularMedalhas(
  checkinsValidados: number,
  sequenciaAtual: number,
  totalGraduacoes: number,
): MedalhaComEstado[] {
  return MARCOS_MEDALHAS.map((marco) => {
    const valor =
      marco.tipo === 'treinos' ? checkinsValidados : marco.tipo === 'sequencia' ? sequenciaAtual : totalGraduacoes;
    return { ...marco, conquistada: valor >= marco.quantidade };
  });
}

// RF33: "100, 250, 450" → [100, 250, 450]. Devolve null se algum item não for inteiro.
export function lerTabelaNiveis(texto: string): number[] | null {
  const partes = texto.split(/[,;\s]+/).filter(Boolean);
  if (partes.length === 0) return null;
  const numeros = partes.map(Number);
  return numeros.every((n) => Number.isInteger(n)) ? numeros : null;
}

export interface ValoresGamificacao {
  pontosPorCheckin: number;
  pontosPorMissao: number;
  niveisXp: number[];
}

// RF33: mensagem do primeiro problema encontrado, ou null se os valores podem ser gravados
export function validarConfiguracao(valores: ValoresGamificacao): string | null {
  const { pontosPorCheckin: checkin, pontosPorMissao: missao, niveis } = LIMITES_CONFIGURACAO;
  if (!Number.isInteger(valores.pontosPorCheckin) || valores.pontosPorCheckin < checkin.minimo || valores.pontosPorCheckin > checkin.maximo) {
    return `Pontos por check-in precisa ser um número inteiro de ${checkin.minimo} a ${checkin.maximo}.`;
  }
  if (!Number.isInteger(valores.pontosPorMissao) || valores.pontosPorMissao < missao.minimo || valores.pontosPorMissao > missao.maximo) {
    return `Pontos por missão precisa ser um número inteiro de ${missao.minimo} a ${missao.maximo}.`;
  }
  const tabela = valores.niveisXp;
  if (tabela.length < niveis.minimo || tabela.length > niveis.maximo) {
    return `A tabela de níveis precisa ter de ${niveis.minimo} a ${niveis.maximo} valores.`;
  }
  if (tabela.some((xp, i) => !Number.isInteger(xp) || xp <= 0 || (i > 0 && xp <= tabela[i - 1]))) {
    return 'Os valores da tabela de níveis precisam ser inteiros positivos e crescentes.';
  }
  return null;
}
