// RF31: decisões puras das notificações (quem recebe o quê), sem Firebase — testadas direto pelo
// Jest em tests/functions/notificacoes-regras.test.ts.
import { horaLocal } from './datas';

// RF19: marcos de medalha de treinos e de sequência — cópia de MARCOS_MEDALHAS em
// src/config/gamificacao.ts (as functions não importam código do app; mantenha os dois iguais).
// A medalha de graduação é notificada pela própria criação da graduação.
const MARCOS = [
  { id: 'treinos-10', rotulo: '10 treinos', tipo: 'treinos', quantidade: 10 },
  { id: 'treinos-30', rotulo: '30 treinos', tipo: 'treinos', quantidade: 30 },
  { id: 'treinos-100', rotulo: '100 treinos', tipo: 'treinos', quantidade: 100 },
  { id: 'sequencia-7', rotulo: '7 treinos seguidos', tipo: 'sequencia', quantidade: 7 },
  { id: 'sequencia-30', rotulo: '30 treinos seguidos', tipo: 'sequencia', quantidade: 30 },
] as const;

export function marcosAlcancados(treinosValidados: number, sequencia: number): { id: string; rotulo: string }[] {
  return MARCOS
    .filter((m) => (m.tipo === 'treinos' ? treinosValidados : sequencia) >= m.quantidade)
    .map(({ id, rotulo }) => ({ id, rotulo }));
}

export interface SessaoDoDia {
  inicio: Date;
  leitoresIds: string[];
  responsavelId: string;
  professorId: string;
}

// RF31: no máximo um lembrete por aluno por dia de treino. Para cada aluno com sessão hoje
// (leitoresIds sem o responsável e o professor da sessão), a sessão mais cedo; quem já recebeu
// lembrete hoje (`ultimoLembrete == hoje`) fica de fora.
export function selecionarLembretes(
  sessoes: SessaoDoDia[],
  ultimoLembrete: Map<string, string | undefined>,
  hoje: string,
): Map<string, Date> {
  const primeiraSessao = new Map<string, Date>();
  sessoes.forEach((s) => {
    s.leitoresIds
      .filter((id) => id !== s.responsavelId && id !== s.professorId)
      .forEach((alunoId) => {
        const atual = primeiraSessao.get(alunoId);
        if (!atual || s.inicio < atual) primeiraSessao.set(alunoId, s.inicio);
      });
  });
  ultimoLembrete.forEach((dia, alunoId) => {
    if (dia === hoje) primeiraSessao.delete(alunoId);
  });
  return primeiraSessao;
}

export function textoLembrete(inicio: Date): string {
  return `Você tem treino hoje às ${horaLocal(inicio)}. Não esqueça do check-in.`;
}
