// RF33, RF25, RF06: estrutura de faixas por modalidade, personalizável pelo responsável (academia
// ou professor autônomo) em estruturasFaixas/{responsavelId}. Sem personalização, vale a estrutura
// padrão, gerada da lista fixa de src/constants/graduacoes.ts.
//
// A graduação do aluno continua tendo o TEXTO ("Faixa roxa, 2º grau"), que todas as telas já
// mostram, e ganha o registro estruturado (faixaId + grau) a partir do RF33. Para quem só tem o texto
// livre antigo, resolverGraduacao() casa o texto com a estrutura pelo nome da faixa.
// Cópia da estrutura padrão e do casamento em functions/src/faixasRegras.ts (migração) — as
// functions não importam código do app; mantenha os dois iguais.
import { FAIXAS_POR_MODALIDADE, MODALIDADES_COM_GRAU, GRAUS } from '../constants/graduacoes';
import type { CorFaixa, FaixaConfig, GraduacaoEstruturada } from '../types';

export const CORES_FAIXA: readonly CorFaixa[] = [
  'branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'vermelha', 'preta',
];

export const LIMITES_ESTRUTURA = {
  faixas: { minimo: 1, maximo: 20 },
  nome: { maximo: 30 },
  graus: { minimo: 0, maximo: 10 },
} as const;

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// "Roxa" → "roxa"; "Vermelha e preta" → "vermelha-e-preta"; repete com sufixo se já existir
export function idDaFaixa(nome: string, existentes: string[] = []): string {
  const base = normalizar(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'faixa';
  let id = base;
  for (let i = 2; existentes.includes(id); i += 1) id = `${base}-${i}`;
  return id;
}

function corPeloNome(nome: string): CorFaixa {
  const n = normalizar(nome);
  return CORES_FAIXA.find((c) => n.startsWith(c.slice(0, 4))) ?? 'cinza';
}

// Estrutura padrão: as faixas fixas de cada modalidade, com 4 graus no Jiu-Jitsu (como o seletor
// já oferecia) e nenhum nas demais.
export function estruturaPadrao(modalidade: string): FaixaConfig[] {
  const nomes = FAIXAS_POR_MODALIDADE[modalidade] ?? [];
  const graus = MODALIDADES_COM_GRAU.includes(modalidade) ? GRAUS.length : 0;
  return nomes.map((nome) => ({ id: idDaFaixa(nome), nome, cor: corPeloNome(nome), graus }));
}

// A estrutura que vale para o responsável nesta modalidade: a dele, se personalizou; senão a padrão
export function estruturaDaModalidade(
  personalizadas: Record<string, FaixaConfig[]> | null | undefined,
  modalidade: string,
): FaixaConfig[] {
  const propria = personalizadas?.[modalidade];
  return propria && propria.length > 0 ? propria : estruturaPadrao(modalidade);
}

// Texto gravado na graduação e no perfil: "Faixa roxa" / "Faixa roxa, 2º grau" (mesmo formato de
// textoGraduacao() em constants/graduacoes.ts, que o SeloFaixa e as telas antigas já entendem)
export function textoDaFaixa(faixa: Pick<FaixaConfig, 'nome'>, grau: number): string {
  const base = `Faixa ${faixa.nome.toLowerCase()}`;
  return grau > 0 ? `${base}, ${grau}º grau` : base;
}

export interface GraduacaoResolvida {
  indice: number;       // posição da faixa na estrutura (0 = primeira)
  faixa: FaixaConfig;
  grau: number;
}

// Grau escrito no texto livre: "2º grau", "grau 2", "3 dan"
function grauDoTexto(texto: string): number {
  const m = /(\d+)\s*(?:º|°|o|ª)?\s*(?:grau|graus|dan|kyu)/i.exec(texto) ?? /(?:grau|dan|kyu)\s*(\d+)/i.exec(texto);
  return m ? parseInt(m[1], 10) : 0;
}

// Onde o aluno está na estrutura: primeiro pelo registro estruturado (faixaId); senão pelo texto
// livre, procurando o nome de faixa mais longo que aparece nele ("vermelha e preta" antes de
// "preta"). Devolve null se nada casa (o texto continua sendo mostrado, só sem barra de progresso).
export function resolverGraduacao(
  faixas: FaixaConfig[],
  registro?: { faixaId?: string; grau?: number } | null,
  texto?: string | null,
): GraduacaoResolvida | null {
  if (registro?.faixaId) {
    const indice = faixas.findIndex((f) => f.id === registro.faixaId);
    if (indice >= 0) return { indice, faixa: faixas[indice], grau: Math.min(registro.grau ?? 0, faixas[indice].graus) };
  }
  if (!texto) return null;
  const alvo = normalizar(texto);
  let melhor = -1;
  faixas.forEach((f, i) => {
    const nome = normalizar(f.nome);
    const casa = new RegExp(`(^|[^a-z])${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(alvo);
    if (casa && (melhor < 0 || nome.length > normalizar(faixas[melhor].nome).length)) melhor = i;
  });
  if (melhor < 0) return null;
  return { indice: melhor, faixa: faixas[melhor], grau: Math.min(grauDoTexto(texto), faixas[melhor].graus) };
}

export interface ProgressoFaixa {
  grau: number;
  grausDaFaixa: number;
  proxima: FaixaConfig | null;
  fracao: number; // 0..1 — graus da faixa atual (decisão de produto, docs/DECISOES_PENDENTES.md)
  posicao: number; // 1-based
  total: number;
}

// RF33, RN03: progresso até a próxima graduação medido pelos graus da faixa atual. É só leitura do
// que o responsável já registrou — a graduação continua sendo decisão humana, nunca automática.
// Faixa sem graus: barra vazia até a próxima; última faixa com todos os graus (ou sem graus): cheia.
export function progressoAteProximaFaixa(faixas: FaixaConfig[], atual: GraduacaoResolvida): ProgressoFaixa {
  const proxima = faixas[atual.indice + 1] ?? null;
  const grausDaFaixa = atual.faixa.graus;
  const fracao = grausDaFaixa > 0 ? atual.grau / grausDaFaixa : proxima ? 0 : 1;
  return { grau: atual.grau, grausDaFaixa, proxima, fracao, posicao: atual.indice + 1, total: faixas.length };
}

// Mensagem do primeiro problema, ou null se a estrutura pode ser gravada. Os mesmos limites de
// tamanho são conferidos em firestore.rules; o conteúdo de cada faixa só aqui (Rules não percorre listas).
export function validarEstrutura(faixas: FaixaConfig[]): string | null {
  const { faixas: lim, nome, graus } = LIMITES_ESTRUTURA;
  if (faixas.length < lim.minimo || faixas.length > lim.maximo) return `A modalidade precisa ter de ${lim.minimo} a ${lim.maximo} faixas.`;
  const vistos = new Set<string>();
  for (const f of faixas) {
    const n = normalizar(f.nome);
    if (!n) return 'Toda faixa precisa de um nome.';
    if (f.nome.trim().length > nome.maximo) return `O nome da faixa pode ter até ${nome.maximo} letras.`;
    if (vistos.has(n)) return `A faixa "${f.nome.trim()}" aparece duas vezes.`;
    vistos.add(n);
    if (!CORES_FAIXA.includes(f.cor)) return `Escolha uma cor para a faixa "${f.nome.trim()}".`;
    if (!Number.isInteger(f.graus) || f.graus < graus.minimo || f.graus > graus.maximo) {
      return `Os graus da faixa "${f.nome.trim()}" precisam ser um número inteiro de ${graus.minimo} a ${graus.maximo}.`;
    }
  }
  if (new Set(faixas.map((f) => f.id)).size !== faixas.length) return 'Há faixas repetidas.';
  return null;
}

// RF33: faixa do aluno numa modalidade, pronta para o Perfil (selo + barra)
export interface FaixaDoAluno {
  cor: CorFaixa;
  graus: number;
  progresso: ProgressoFaixa;
}

// Para cada modalidade com graduação, resolve a faixa na estrutura certa: a de quem registrou a
// graduação estruturada; senão a do primeiro responsável do aluno; senão a padrão. Modalidade cujo
// texto não casa com nenhuma faixa fica de fora (o texto continua aparecendo, sem barra).
export function faixasDoAluno(
  graduacoes: Record<string, string> | undefined,
  estruturadas: Record<string, GraduacaoEstruturada> | undefined,
  estruturaDe: (responsavelId: string | undefined) => Record<string, FaixaConfig[]> | null | undefined,
  responsavelPadrao: string | undefined,
): Record<string, FaixaDoAluno> {
  const resultado: Record<string, FaixaDoAluno> = {};
  for (const [modalidade, texto] of Object.entries(graduacoes ?? {})) {
    const registro = estruturadas?.[modalidade];
    const faixas = estruturaDaModalidade(estruturaDe(registro?.responsavelId ?? responsavelPadrao), modalidade);
    const atual = resolverGraduacao(faixas, registro, texto);
    if (!atual) continue;
    resultado[modalidade] = { cor: atual.faixa.cor, graus: atual.grau, progresso: progressoAteProximaFaixa(faixas, atual) };
  }
  return resultado;
}
