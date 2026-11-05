// RF17, RF19, RF21: nível/progresso, medalhas e sequência — todos calculados a partir de dados
// que o aluno já pode ler (checkins próprios, graduações próprias), sem coleção nova. Valores
// de configuração em src/config/gamificacao.ts são PROVISÓRIOS — ver docs/DECISOES_PENDENTES.md.
import { CheckIn } from '../types';
import { LIMITES_CONFIGURACAO, MARCOS_MEDALHAS, MarcoMedalha, NIVEIS_XP } from '../config/gamificacao';

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

// RF21: dias consecutivos (não sessões) com ao menos um check-in validado, contados a partir do
// dia mais recente. Se hoje ainda não tem check-in, conta a partir de ontem — não zera a
// sequência no meio do dia antes do aluno ter chance de treinar.
export function calcularSequencia(checkins: CheckIn[]): number {
  const diasComPresenca = new Set(
    checkins.filter((c) => c.status === 'validado').map((c) => c.dataHora.toDate().toDateString()),
  );
  if (diasComPresenca.size === 0) return 0;

  let sequencia = 0;
  const cursor = new Date();
  if (!diasComPresenca.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (diasComPresenca.has(cursor.toDateString())) {
    sequencia += 1;
    cursor.setDate(cursor.getDate() - 1);
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
