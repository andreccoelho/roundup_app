// RF17, RF19, RF21: nível/progresso, medalhas e sequência — todos calculados a partir de dados
// que o aluno já pode ler (checkins próprios, graduações próprias), sem coleção nova. Valores
// de configuração em src/config/gamificacao.ts são PROVISÓRIOS — ver docs/DECISOES_PENDENTES.md.
import { CheckIn } from '../types';
import { MARCOS_MEDALHAS, MarcoMedalha, NIVEIS_XP } from '../config/gamificacao';

export interface ProgressoNivel {
  nivel: number;
  xpAtual: number; // progresso dentro do nível atual
  xpProximoNivel: number; // total necessário para completar o nível atual
  xpTotal: number;
}

// RF17: nível atual, pontos acumulados e quanto falta para o próximo nível
export function calcularProgressoNivel(pontosTotais: number): ProgressoNivel {
  let nivel = 1;
  let baseNivel = 0;

  for (const limiar of NIVEIS_XP) {
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
