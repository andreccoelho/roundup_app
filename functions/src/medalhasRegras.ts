// RF19: marcos de medalha e a data em que cada um foi atingido — decisões puras, sem Firebase,
// testadas direto pelo Jest em tests/functions/medalhas-regras.test.ts.
//
// Os marcos são cópia de MARCOS_MEDALHAS em src/config/gamificacao.ts (as functions não importam
// código do app; mantenha os dois iguais). A mesma função calcula a medalha nova no gatilho
// (functions/src/medalhas.ts) e a data histórica na migração (scripts/migrar-medalhas.cjs).
import type { SessaoDaSequencia } from './sequencia';

export type TipoMarco = 'treinos' | 'sequencia' | 'graduacoes';

export interface Marco {
  id: string;
  rotulo: string;
  tipo: TipoMarco;
  quantidade: number;
}

export const MARCOS: readonly Marco[] = [
  { id: 'treinos-10', rotulo: '10 treinos', tipo: 'treinos', quantidade: 10 },
  { id: 'treinos-30', rotulo: '30 treinos', tipo: 'treinos', quantidade: 30 },
  { id: 'treinos-100', rotulo: '100 treinos', tipo: 'treinos', quantidade: 100 },
  { id: 'sequencia-7', rotulo: '7 treinos seguidos', tipo: 'sequencia', quantidade: 7 },
  { id: 'sequencia-30', rotulo: '30 treinos seguidos', tipo: 'sequencia', quantidade: 30 },
  { id: 'graduacoes-1', rotulo: 'Primeira graduação', tipo: 'graduacoes', quantidade: 1 },
];

// Um check-in validado: a sessão dele e QUANDO ele passou a valer (validadoEm; sem isso, o
// horário do treino). É esse instante que vira a data de conquista.
export interface TreinoValidado {
  sessaoId: string;
  quandoMs: number;
}

// Para cada marco já atingido, o instante em que foi atingido:
// - treinos-N: quando o N-ésimo check-in passou a valer (em ordem de validação);
// - sequencia-N: quando a sessão que completou N treinos seguidos foi validada — mesmo critério de
//   maiorSequenciaDeSessoes() (functions/src/sequencia.ts, RF21), em todos os escopos do aluno;
// - graduacoes-1: a primeira graduação registrada.
export function datasDeConquista(
  treinos: TreinoValidado[],
  sessoes: SessaoDaSequencia[],
  statusPorSessao: Map<string, string>,
  graduacoesMs: number[],
  agoraMs: number,
): Map<string, number> {
  const datas = new Map<string, number>();
  const porValidacao = [...treinos].sort((a, b) => a.quandoMs - b.quandoMs);
  const quandoPorSessao = new Map(treinos.map((t) => [t.sessaoId, t.quandoMs]));

  // Sequência: percorre as sessões em ordem e anota a primeira vez que cada tamanho é alcançado
  const primeiraVez = new Map<number, number>();
  let atual = 0;
  const emOrdem = sessoes.filter((s) => s.status !== 'cancelada').sort((a, b) => a.janelaFimMs - b.janelaFimMs);
  for (const sessao of emOrdem) {
    const status = statusPorSessao.get(sessao.id);
    if (status === 'validado') {
      atual += 1;
      if (!primeiraVez.has(atual)) primeiraVez.set(atual, quandoPorSessao.get(sessao.id) ?? sessao.janelaFimMs);
    } else if (sessao.janelaFimMs > agoraMs || status === 'pendente') {
      continue;
    } else {
      atual = 0;
    }
  }

  const graduacoes = [...graduacoesMs].sort((a, b) => a - b);
  for (const marco of MARCOS) {
    let quando: number | undefined;
    if (marco.tipo === 'treinos') quando = porValidacao[marco.quantidade - 1]?.quandoMs;
    else if (marco.tipo === 'sequencia') quando = primeiraVez.get(marco.quantidade);
    else quando = graduacoes[marco.quantidade - 1];
    if (quando !== undefined) datas.set(marco.id, quando);
  }
  return datas;
}
