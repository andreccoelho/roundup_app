// RF21: sequência de treinos por SESSÃO agendada — mesmo critério de calcularSequencia() em
// src/utils/gamificacao.ts (as functions não importam código do app; mantenha os dois iguais).
// Quebra numa sessão do aluno cuja janela de check-in já fechou sem presença validada. Não contam
// nem quebram: sessão cancelada, janela ainda aberta, check-in pendente de validação.
// Módulo sem dependência do Firebase, testado direto pelo Jest.

export interface SessaoDaSequencia {
  id: string;
  status: string;
  janelaFimMs: number;
}

// A MAIOR sequência no período (não a atual): uma missão de sequência concluída ou uma medalha
// já avisada não "desconquistam" porque a sequência quebrou depois.
export function maiorSequenciaDeSessoes(
  sessoes: SessaoDaSequencia[],
  statusCheckinPorSessao: Map<string, string>,
  agoraMs: number,
): number {
  const emOrdem = sessoes
    .filter((s) => s.status !== 'cancelada')
    .sort((a, b) => a.janelaFimMs - b.janelaFimMs);
  let maior = 0;
  let atual = 0;
  for (const sessao of emOrdem) {
    const status = statusCheckinPorSessao.get(sessao.id);
    if (status === 'validado') {
      atual += 1;
      maior = Math.max(maior, atual);
    } else if (sessao.janelaFimMs > agoraMs || status === 'pendente') {
      continue;
    } else {
      atual = 0;
    }
  }
  return maior;
}
