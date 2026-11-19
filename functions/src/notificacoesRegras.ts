// RF31: decisões puras das notificações (quem recebe o quê), sem Firebase — testadas direto pelo
// Jest em tests/functions/notificacoes-regras.test.ts.
import { horaLocal } from './datas';
import { MARCOS } from './medalhasRegras';

// RF19: marcos de treinos e de sequência já atingidos (os marcos ficam em medalhasRegras.ts). A
// medalha de graduação é avisada pela própria criação da graduação.
export function marcosAlcancados(treinosValidados: number, sequencia: number): { id: string; rotulo: string }[] {
  return MARCOS
    .filter((m) => m.tipo !== 'graduacoes')
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
