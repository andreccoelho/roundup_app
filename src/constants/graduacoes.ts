// RF06: graduações selecionáveis por modalidade na ficha de atleta. O dado salvo continua sendo
// texto (`faixaOuGrau`), no formato que o SeloFaixa já interpreta ("Faixa roxa", "Faixa preta, 2º grau").
// Modalidades sem sistema de graduação usam "Não se aplica"; as demais aceitam "Sem graduação".
export const SEM_GRADUACAO = 'Sem graduação';
export const NAO_SE_APLICA = 'Não se aplica';

export const MODALIDADES_SEM_GRADUACAO: readonly string[] = ['Boxe', 'MMA', 'Kickboxing'];

export const FAIXAS_POR_MODALIDADE: Record<string, readonly string[]> = {
  'Jiu-Jitsu': ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'],
  'Muay Thai': ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Vermelha', 'Preta'],
  'Karatê': ['Branca', 'Amarela', 'Laranja', 'Verde', 'Roxa', 'Marrom', 'Preta'],
  Taekwondo: ['Branca', 'Amarela', 'Verde', 'Azul', 'Vermelha', 'Preta'],
  'Judô': ['Branca', 'Cinza', 'Azul', 'Amarela', 'Laranja', 'Verde', 'Roxa', 'Marrom', 'Preta'],
};

// Graus (tarjas) só no Jiu-Jitsu, onde são parte da graduação (1º a 4º grau).
export const MODALIDADES_COM_GRAU: readonly string[] = ['Jiu-Jitsu'];
export const GRAUS = [1, 2, 3, 4] as const;

export function modalidadeSemGraduacao(modalidade: string): boolean {
  return MODALIDADES_SEM_GRADUACAO.includes(modalidade);
}

export interface EscolhaGraduacao {
  faixa: string; // '' (nada escolhido), SEM_GRADUACAO ou nome da faixa
  grau: number; // 0 = sem grau
}

export const ESCOLHA_VAZIA: EscolhaGraduacao = { faixa: '', grau: 0 };

// Texto final da escolha; '' quando ainda não escolheu.
export function textoGraduacao(modalidade: string, escolha: EscolhaGraduacao | undefined): string {
  if (modalidadeSemGraduacao(modalidade)) return NAO_SE_APLICA;
  if (!escolha || !escolha.faixa) return '';
  if (escolha.faixa === SEM_GRADUACAO) return SEM_GRADUACAO;
  const base = `Faixa ${escolha.faixa.toLowerCase()}`;
  return escolha.grau > 0 && MODALIDADES_COM_GRAU.includes(modalidade) ? `${base}, ${escolha.grau}º grau` : base;
}
