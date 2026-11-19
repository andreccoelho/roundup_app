// RF23: decisões puras de público-alvo e vigência das missões, sem Firebase — testadas direto pelo
// Jest em tests/functions/missoes-regras.test.ts. Mesmas regras de src/utils/missoes.ts no app (as
// functions não importam código do app; mantenha os dois iguais).
//
// Vigência: [vigenciaInicio, vigenciaFim), em milissegundos. O app grava o início como 00:00 do
// primeiro dia e o fim como 00:00 do dia SEGUINTE ao último (fim exclusivo). Missões criadas antes
// do RF23 completo não têm esses campos: valem desde `criadoEm` e não terminam.

export type PublicoAlvo = 'todos' | 'turma' | 'alunos';
export type SituacaoMissao = 'agendada' | 'vigente' | 'encerrada' | 'inativa';

export interface MissaoParaRegras {
  ativa?: boolean;
  publicoAlvo?: PublicoAlvo;
  turmaId?: string;
  alunosAlvoIds?: string[];
  vigenciaInicioMs?: number | null;
  vigenciaFimMs?: number | null;
  criadoEmMs?: number | null;
}

export function inicioDaVigencia(m: MissaoParaRegras): number {
  return m.vigenciaInicioMs ?? m.criadoEmMs ?? 0;
}

export function fimDaVigencia(m: MissaoParaRegras): number {
  return m.vigenciaFimMs ?? Number.POSITIVE_INFINITY;
}

// Um instante (ex.: o horário de um check-in) está dentro da vigência
export function dentroDaVigencia(m: MissaoParaRegras, instanteMs: number): boolean {
  return instanteMs >= inicioDaVigencia(m) && instanteMs < fimDaVigencia(m);
}

export function situacaoDaMissao(m: MissaoParaRegras, agoraMs: number): SituacaoMissao {
  if (m.ativa !== true) return 'inativa';
  if (agoraMs < inicioDaVigencia(m)) return 'agendada';
  if (agoraMs >= fimDaVigencia(m)) return 'encerrada';
  return 'vigente';
}

// Público-alvo efetivo: sempre restrito aos alunos com vínculo aceito com o responsável (RN05).
// 'turma' = matrícula ativa na turma; 'alunos' = os escolhidos; ausente = 'todos' (missões antigas).
export function publicoDaMissao(m: MissaoParaRegras, vinculados: string[], matriculadosNaTurma: string[]): string[] {
  const tipo = m.publicoAlvo ?? 'todos';
  let alvo: string[];
  if (tipo === 'todos') alvo = vinculados;
  else if (tipo === 'turma') alvo = vinculados.filter((id) => matriculadosNaTurma.includes(id));
  else alvo = vinculados.filter((id) => (m.alunosAlvoIds ?? []).includes(id));
  return [...new Set(alvo)].sort();
}

// Quem lê a missão (além do responsável, que lê pelo próprio responsavelId): o público inteiro
// enquanto ela está vigente; fora disso, só quem do público já a concluiu (ela fica no histórico
// de "Concluídas" do aluno — decisão de produto registrada em docs/DECISOES_PENDENTES.md).
export function leitoresDaMissao(situacao: SituacaoMissao, publico: string[], concluintes: string[]): string[] {
  if (situacao === 'vigente') return [...publico];
  return publico.filter((id) => concluintes.includes(id));
}
