// RF01: Cadastro e autenticação de usuários com perfil diferenciado
export type Perfil = 'academia' | 'professor' | 'aluno';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  fotoUrl?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

// RF02, RN01: Vínculo entre atores — alunos sempre precisam de vínculo ativo
export type StatusVinculo = 'pendente' | 'ativo' | 'inativo';
export type TipoVinculo = 'aluno-professor' | 'aluno-academia' | 'professor-academia';

export interface Vinculo {
  id: string;
  tipo: TipoVinculo;
  solicitanteId: string;
  destinatarioId: string;
  status: StatusVinculo;
  criadoEm: Date;
  atualizadoEm: Date;
}

// RF03: Gestão de turmas por academia ou professor autônomo
export interface Turma {
  id: string;
  nome: string;
  modalidade: string;
  responsavelId: string;
  academiaId?: string;
  descricao?: string;
  ativa: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

// RF04: Sessões de treinamento vinculadas a turmas
export interface Sessao {
  id: string;
  turmaId: string;
  professorId: string;
  dataHoraInicio: Date;
  dataHoraFim?: Date;
  descricao?: string;
  criadoEm: Date;
}

// RF13, RN02: Check-in único por sessão por aluno
export interface CheckIn {
  id: string;
  sessaoId: string;
  alunoId: string;
  dataHora: Date;
  pontos: number;
}

// RF05: Criação e gerenciamento de missões de gamificação
export type TipoMissao = 'presenca' | 'pontuacao' | 'sequencia' | 'personalizada';

export interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoMissao;
  meta: number;
  pontos: number;
  responsavelId: string;
  ativa: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

// RF06: Acompanhamento do progresso de missões por aluno
export interface MissaoProgresso {
  id: string;
  missaoId: string;
  alunoId: string;
  progressoAtual: number;
  concluida: boolean;
  dataConclusao?: Date;
  atualizadoEm: Date;
}

// RF07: Registro de graduações (faixas/belts)
export interface Graduacao {
  id: string;
  alunoId: string;
  responsavelId: string;
  modalidade: string;
  grau: string;
  dataGraduacao: Date;
  observacoes?: string;
  criadoEm: Date;
}

// RF08, RF09: Configurações de pontuação por academia ou professor autônomo
export interface ConfiguracaoGamificacao {
  id: string;
  responsavelId: string;
  pontosPorCheckin: number;
  pontosPorMissao: number;
  pontosPorGraduacao: number;
  atualizadoEm: Date;
}

// RN10: Consentimento LGPD obrigatório registrado no cadastro
export interface ConsentimentoLGPD {
  id: string;
  usuarioId: string;
  versao: string;
  aceito: boolean;
  dataHora: Date;
  ip?: string;
}
