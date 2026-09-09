import { Timestamp } from 'firebase/firestore';

// RF01, RF02, RF03, RF04, RF05, RF06: cadastro, autenticação e perfil diferenciado por ator
export type Perfil = 'academia' | 'professor' | 'aluno';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  fotoUrl?: string;
  autonomo?: boolean;   // RF05, RF08: só se aplica a perfil 'professor' — nasce true (RN06), vira false ao aceitar vínculo com academia
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

// RN05, RN06: documento privado em usuarios/{uid}/privado/vinculos — nunca lido por nenhum
// client (nem o próprio dono, na prática: só existe para get()/exists() dentro de
// firestore.rules, que não passam pelas regras de leitura). Sai do documento raiz de
// Usuario, que é legível por qualquer autenticado, para não expor o grafo institucional.
export interface VinculosPrivado {
  responsaveisIds: string[];  // uids dos responsáveis (destinatarioId) com vínculo 'aceito'
}

// RF07, RF08, RN05, RN06: vínculo entre atores — tipo derivado do par de perfis
// status 'aceito' é o vínculo ativo em produção (RF09, gestão do vínculo pela academia, é Ciclo 3)
export type StatusVinculo = 'pendente' | 'aceito' | 'recusado';
export type TipoVinculo = 'aluno-academia' | 'aluno-professor' | 'professor-academia';
export type PerfilSolicitante = 'aluno' | 'professor';
export type PerfilDestinatario = 'professor' | 'academia';

export interface Vinculo {
  id: string; // `${solicitanteId}_${destinatarioId}`
  solicitanteId: string;
  destinatarioId: string;
  perfilSolicitante: PerfilSolicitante;
  perfilDestinatario: PerfilDestinatario;
  tipo: TipoVinculo;
  status: StatusVinculo;
  criadoEm: Timestamp;
  respondidoEm?: Timestamp;
}

// RF10, RN07: toda turma pertence a uma academia ou a um professor autônomo
export type NivelTurma = 'iniciante' | 'intermediario' | 'avancado';

export interface Turma {
  id: string;
  nome: string;
  modalidade: string;
  nivel: NivelTurma;
  responsavelId: string;            // uid da academia ou do professor autônomo
  responsavelPerfil: 'academia' | 'professor';  // desnormalizado para as regras
  professorId?: string;             // professor que ministra, quando o responsável é academia
  descricao?: string;
  ativa: boolean;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

// RF11: matrícula do aluno em turma
export type StatusMatricula = 'ativa' | 'inativa';

export interface Matricula {
  id: string;                       // `${turmaId}_${alunoId}`, determinístico
  turmaId: string;
  alunoId: string;
  responsavelId: string;            // desnormalizado da turma, habilita consulta pelo gestor
  status: StatusMatricula;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

// RF12, RN07, RN08: sessão de treino pertence a uma turma e define a janela de check-in
export type StatusSessao = 'agendada' | 'aberta' | 'encerrada' | 'cancelada';

export interface Sessao {
  id: string;
  turmaId: string;
  responsavelId: string;            // desnormalizado da turma
  professorId: string;
  inicio: Timestamp;
  fim: Timestamp;
  janelaCheckInInicio: Timestamp;   // RN08
  janelaCheckInFim: Timestamp;      // RN08
  status: StatusSessao;
  leitoresIds: string[];   // RF14, RNF04: responsável, professor e alunos matriculados — controle de acesso na própria sessão, sem get() cruzado em consultas de lista
  descricao?: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

// RF13, RF14, RF15, RN02, RN08: check-in único por aluno por sessão, dentro da janela
export type StatusCheckIn = 'pendente' | 'validado' | 'rejeitado';

export interface CheckIn {
  id: string;                       // `${sessaoId}_${alunoId}`, garante RN02 por construção
  sessaoId: string;
  turmaId: string;
  alunoId: string;
  responsavelId: string;
  dataHora: Timestamp;
  status: StatusCheckIn;            // nasce 'pendente', validação é RF22 no Ciclo 3
  pontos: number;                   // sempre 0 nesta fase, crédito é RF16 no Ciclo 2
  validadoPor?: string;
  validadoEm?: Timestamp;
}

// RF23 (Ciclo 3): criação e gerenciamento de missões de gamificação
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

// RF18 (Ciclo 2): acompanhamento do progresso de missões por aluno
export interface MissaoProgresso {
  id: string;
  missaoId: string;
  alunoId: string;
  progressoAtual: number;
  concluida: boolean;
  dataConclusao?: Date;
  atualizadoEm: Date;
}

// RF25, RN03 (Ciclo 3): registro de graduações (faixas/belts)
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

// RF33 (Ciclo 3): configurações de pontuação por academia ou professor autônomo
export interface ConfiguracaoGamificacao {
  id: string;
  responsavelId: string;
  pontosPorCheckin: number;
  pontosPorMissao: number;
  pontosPorGraduacao: number;
  atualizadoEm: Date;
}

// RF28, RNF10 (Ciclo 4): consentimento LGPD obrigatório registrado no cadastro
export interface ConsentimentoLGPD {
  id: string;
  usuarioId: string;
  versao: string;
  aceito: boolean;
  dataHora: Date;
  ip?: string;
}
