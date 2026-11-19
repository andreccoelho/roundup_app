// RF33: estrutura padrão de faixas e casamento do texto livre antigo com ela — decisões puras, sem
// Firebase, usadas pela migração (scripts/migrar-faixas.cjs) e testadas em
// tests/functions/faixas-regras.test.ts. Cópia de src/utils/faixas.ts e de FAIXAS_POR_MODALIDADE
// (src/constants/graduacoes.ts) — as functions não importam código do app; mantenha iguais.

export interface FaixaConfig {
  id: string;
  nome: string;
  cor: string;
  graus: number;
}

const FAIXAS_POR_MODALIDADE: Record<string, readonly string[]> = {
  'Jiu-Jitsu': ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'],
  'Muay Thai': ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Vermelha', 'Preta'],
  'Karatê': ['Branca', 'Amarela', 'Laranja', 'Verde', 'Roxa', 'Marrom', 'Preta'],
  Taekwondo: ['Branca', 'Amarela', 'Verde', 'Azul', 'Vermelha', 'Preta'],
  'Judô': ['Branca', 'Cinza', 'Azul', 'Amarela', 'Laranja', 'Verde', 'Roxa', 'Marrom', 'Preta'],
};
const MODALIDADES_COM_GRAU = ['Jiu-Jitsu'];
const GRAUS_PADRAO = 4;
const CORES = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'vermelha', 'preta'];

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function idDaFaixa(nome: string): string {
  return normalizar(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'faixa';
}

export function estruturaPadrao(modalidade: string): FaixaConfig[] {
  const graus = MODALIDADES_COM_GRAU.includes(modalidade) ? GRAUS_PADRAO : 0;
  return (FAIXAS_POR_MODALIDADE[modalidade] ?? []).map((nome) => ({
    id: idDaFaixa(nome),
    nome,
    cor: CORES.find((c) => normalizar(nome).startsWith(c.slice(0, 4))) ?? 'cinza',
    graus,
  }));
}

export function estruturaDaModalidade(personalizadas: Record<string, FaixaConfig[]> | undefined, modalidade: string): FaixaConfig[] {
  const propria = personalizadas?.[modalidade];
  return propria && propria.length > 0 ? propria : estruturaPadrao(modalidade);
}

function grauDoTexto(texto: string): number {
  const m = /(\d+)\s*(?:º|°|o|ª)?\s*(?:grau|graus|dan|kyu)/i.exec(texto) ?? /(?:grau|dan|kyu)\s*(\d+)/i.exec(texto);
  return m ? parseInt(m[1], 10) : 0;
}

// O nome de faixa mais longo que aparece no texto; null se nenhum aparece
export function casarTexto(faixas: FaixaConfig[], texto: string): { faixa: FaixaConfig; grau: number } | null {
  const alvo = normalizar(texto);
  let melhor: FaixaConfig | null = null;
  for (const f of faixas) {
    const nome = normalizar(f.nome);
    const casa = new RegExp(`(^|[^a-z])${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(alvo);
    if (casa && (!melhor || nome.length > normalizar(melhor.nome).length)) melhor = f;
  }
  return melhor ? { faixa: melhor, grau: Math.min(grauDoTexto(texto), melhor.graus) } : null;
}
