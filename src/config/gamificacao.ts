// PROVISÓRIO — valores de exemplo para destravar Ciclo 2/3 na interface antes da validação de
// produto e da orientadora. Nenhum número aqui é final: quantidade de XP por check-in, os
// limiares de nível, a janela de classificação e os marcos de medalha precisam ser confirmados
// antes da entrega do TCC. Ver docs/DECISOES_PENDENTES.md para a lista completa de decisões
// provisórias e o RF/RN de cada uma.

// RF16, RN01: pontos creditados por check-in validado
export const XP_POR_CHECKIN_VALIDADO = 10;

// RF17: XP acumulado (cumulativo, não por degrau) necessário para completar cada nível —
// progressão provisória em +50 por degrau (100, +150, +200, +250, +300, +350, +400, +450,
// +500, +550)
export const NIVEIS_XP = [100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250] as const;

// RF20, RN04: janela de tempo considerada na classificação — hoje só rótulo de UI. O reset
// periódico de pontos ainda NÃO está implementado (ver docs/DECISOES_PENDENTES.md); a
// classificação hoje é cumulativa desde sempre.
export const JANELA_RANKING = 'mensal' as const;

// RF19: marcos provisórios para concessão de medalhas. Calculados ao vivo a partir do
// histórico do aluno a cada carregamento de tela — não há coleção de medalhas persistida
// (sem registro de "quando" a medalha foi conquistada, sem notificação de nova conquista).
export interface MarcoMedalha {
  id: string;
  rotulo: string;
  tipo: 'treinos' | 'sequencia' | 'graduacoes';
  quantidade: number;
}

export const MARCOS_MEDALHAS: MarcoMedalha[] = [
  { id: 'treinos-10', rotulo: '10 treinos', tipo: 'treinos', quantidade: 10 },
  { id: 'treinos-30', rotulo: '30 treinos', tipo: 'treinos', quantidade: 30 },
  { id: 'treinos-100', rotulo: '100 treinos', tipo: 'treinos', quantidade: 100 },
  { id: 'sequencia-7', rotulo: '7 dias seguidos', tipo: 'sequencia', quantidade: 7 },
  { id: 'sequencia-30', rotulo: '30 dias seguidos', tipo: 'sequencia', quantidade: 30 },
  { id: 'graduacoes-1', rotulo: 'Primeira graduação', tipo: 'graduacoes', quantidade: 1 },
];

// RF32: critério provisório de "queda relevante" de frequência — dentro da janela dos últimos
// N check-ins do aluno (mesma janela de `frequenciaRecente`, ver src/services/frequencia.ts),
// menos de MINIMO_PRESENCAS_JANELA validados sinaliza queda. Não é uma análise de tendência
// (não compara com o histórico mais antigo do aluno) nem considera se houve sessão agendada
// nesse intervalo — sinaliza mesmo quem só teve poucas sessões oferecidas. Ver
// docs/DECISOES_PENDENTES.md.
export const QUEDA_FREQUENCIA = {
  janela: 5,
  minimoPresencasJanela: 2,
} as const;
