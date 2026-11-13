import { Timestamp } from 'firebase/firestore';

// RF01, RF02, RF03, RF04, RF05, RF06: cadastro, autenticação e perfil diferenciado por ator
export type Perfil = 'academia' | 'professor' | 'aluno';

// RF30 (Ciclo 4): identificação do responsável legal, obrigatória no cadastro quando o aluno é
// menor de 18 anos (Usuario.dataNascimento). Guardado dentro do próprio Usuario — mais simples
// que uma coleção separada, e não há hoje nenhum outro consumidor que precise dele fora do
// perfil do próprio aluno.
export interface ResponsavelLegal {
  nome: string;
  contato: string; // e-mail ou telefone — RF30 não distingue, texto livre
}

// RNF04, RF28: `usuarios/{uid}` raiz é legível por qualquer autenticado (descoberta de academias
// e professores). Os dados pessoais sensíveis — email, dataNascimento, responsavelLegal — por isso
// NÃO ficam lá: moram em usuarios/{uid}/privado/dados (legível só pelo dono, ver
// DadosPessoaisPrivados). Em memória, `Usuario` do usuário LOGADO traz os três já mesclados
// (buscarMeuUsuario); o `Usuario` de qualquer outra pessoa vem sem eles.
export interface Usuario {
  id: string;
  nome: string;
  email?: string;       // só no usuário logado — vem de privado/dados
  perfil: Perfil;
  fotoUrl?: string;
  autonomo?: boolean;   // RF05, RF08: só se aplica a perfil 'professor' — nasce true (RN06), vira false ao aceitar vínculo com academia
  modalidades?: string[]; // RF04, RF05, RF06: oferecidas (academia), lecionadas (professor) ou praticadas (aluno)
  faixaOuGrau?: string;   // RF06: só perfil 'aluno' — graduação principal (a mais recente registrada), usada nos selos
  // RF06, RF25, RN03: só perfil 'aluno' — graduação por modalidade ({ 'Jiu-Jitsu': 'Faixa azul, 2º grau' }).
  // Declarada pelo aluno no cadastro; depois só muda pelo registro do professor/academia (Cloud Function
  // aplicarGraduacaoNoPerfil, a partir de `graduacoes/{id}`).
  graduacoes?: Record<string, string>;
  graduacao?: string;     // RF05: só perfil 'professor'
  nomeAcademia?: string;  // RF04: só perfil 'academia' — nome institucional, distinto de `nome` (contato)
  endereco?: string;      // RF04: só perfil 'academia'
  dataNascimento?: Timestamp;       // RF30: só perfil 'aluno' — determina se responsavelLegal é obrigatório (privado/dados)
  responsavelLegal?: ResponsavelLegal; // RF30: obrigatório quando dataNascimento indica menor de 18 anos (privado/dados)
  preferenciasNotificacao?: PreferenciasNotificacao; // RF31
  participaClassificacao?: boolean; // RNF11: só perfil 'aluno' — ausente conta como true (padrão é participar)
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

// RNF04: documento privado em usuarios/{uid}/privado/dados — só o dono lê e escreve (regra
// `usuarios/{usuarioId}/privado/{doc}`); as Cloud Functions leem pelo Admin SDK.
export interface DadosPessoaisPrivados {
  email: string;
  dataNascimento?: Timestamp;
  responsavelLegal?: ResponsavelLegal;
}

// RF31: preferências de notificação por tipo (ausente ou true = quer receber). O envio é das Cloud
// Functions em functions/src/notificacoes.ts; o token do aparelho fica em
// usuarios/{uid}/privado/notificacoes.
export interface PreferenciasNotificacao {
  lembreteSessao: boolean;
  novaMissao: boolean;
  conquista: boolean;
}

// RN05, RN06: documento privado em usuarios/{uid}/privado/vinculos — nunca lido por nenhum
// client (nem o próprio dono, na prática: só existe para get()/exists() dentro de
// firestore.rules, que não passam pelas regras de leitura). Sai do documento raiz de
// Usuario, que é legível por qualquer autenticado, para não expor o grafo institucional.
export interface VinculosPrivado {
  responsaveisIds: string[];  // uids dos responsáveis (destinatarioId) com vínculo 'aceito'
}

// RF07, RF08, RN05, RN06: vínculo entre atores — tipo derivado do par de perfis
// status 'aceito' é o vínculo ativo em produção. 'encerrado' (RF08, RF09): só alcançável a partir
// de 'aceito', por qualquer das duas pontas (a academia gerindo, o aluno/professor saindo) — ver
// encerrarVinculo() em services/vinculos.ts. Cancela as matrículas ativas do aluno com aquele
// responsável; check-ins e graduações já existentes ficam como histórico.
export type StatusVinculo = 'pendente' | 'aceito' | 'recusado' | 'encerrado';
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
  // RF10: grade recorrente opcional, preenchida na criação — guardada aqui (não só usada para
  // gerar as sessões iniciais) para a turma continuar sabendo sua própria grade depois, e
  // permitir gerar mais semanas futuramente sem o gestor precisar redigitar dia/horário.
  diasSemana?: number[];            // 0=domingo .. 6=sábado, igual a Date#getDay()
  horarioInicio?: string;           // "HH:MM"
  horarioFim?: string;              // "HH:MM"
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
  pontos: number;                   // RF16: 0 até ser validado; validado vale pontosPorCheckin do responsável (RF33)
  validadoPor?: string;
  validadoEm?: Timestamp;
  classificacaoId?: string;         // RN01: classificação que recebeu o crédito — a regra confere que ela mudou junto
}

// RF23 (Ciclo 3): criação e gerenciamento de missões de gamificação
export type TipoMissao = 'presenca' | 'pontuacao' | 'sequencia' | 'personalizada';

// RF23: público-alvo — todos os alunos com vínculo aceito, os matriculados numa turma, ou alunos
// escolhidos. Sempre restrito a quem tem vínculo aceito com o responsável.
export type PublicoAlvo = 'todos' | 'turma' | 'alunos';
export type SituacaoMissao = 'agendada' | 'vigente' | 'encerrada' | 'inativa';

export interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoMissao;
  meta: number;
  pontos: number;
  responsavelId: string;
  ativa: boolean;
  // RF23: público-alvo. Ausente nas missões criadas antes desta mudança, que valem para 'todos'.
  publicoAlvo?: PublicoAlvo;
  turmaId?: string;          // só com publicoAlvo 'turma'
  alunosAlvoIds?: string[];  // só com publicoAlvo 'alunos'
  // RF23: vigência [início, fim) — 00:00 do primeiro dia até 00:00 do dia seguinte ao último.
  // Ausente nas missões antigas: valem desde criadoEm, sem fim.
  vigenciaInicio?: Timestamp;
  vigenciaFim?: Timestamp;
  // Escritos só pela Cloud Function (functions/src/missoesPublico.ts), nunca pelo client:
  leitoresIds?: string[];          // quem lê: o público na vigência; fora dela, só quem concluiu
  situacao?: SituacaoMissao;
  alunosNotificadosIds?: string[]; // RF31: quem já recebeu o aviso de nova missão
  criadoEm: Date;
  atualizadoEm: Date;
}

// RF18: progresso de missões por aluno, id determinístico `${missaoId}_${alunoId}`. Escrito pela
// Cloud Function atualizarMissoesNoCheckIn (presença, pontuação, sequência) ou pelo responsável
// (personalizada) — nunca pelo aluno. `pontosCreditados`/`periodoCredito` são escritos só pela
// Cloud Function creditarPontosDaMissao, para saber o que estornar se a conclusão for desfeita.
export interface MissaoProgresso {
  id: string;
  missaoId: string;
  alunoId: string;
  responsavelId: string;
  progressoAtual: number;
  concluida: boolean;
  dataConclusao?: Date;
  pontosCreditados?: number;
  periodoCredito?: string;
  atualizadoEm: Date;
}

// RF20, RN04, RN09, RNF11: pontuação do aluno por escopo de vínculo E por mês — id determinístico
// `${alunoId}_${responsavelId}_${periodo}`, um documento por aluno/responsável/mês (RN04: o
// ranking só considera o período vigente; o nível do aluno, RF17, soma todos os períodos).
// `leitoresIds` é mantido só por Cloud Function (functions/src/classificacao.ts): responsável +
// alunos com vínculo aceito com ele, ou só responsável + o próprio aluno quando ele não participa
// da classificação (RNF11). Documentos anteriores a esta mudança (`${alunoId}_${responsavelId}`,
// sem `periodo`) continuam somando no nível, mas não aparecem em nenhum ranking mensal.
export interface Classificacao {
  id: string;
  alunoId: string;
  responsavelId: string;
  periodo: string;          // "AAAA-MM", fuso local — ver periodoDe() em utils/datas.ts
  pontos: number;
  leitoresIds?: string[];
  origemCheckinId?: string; // RN01: check-in cuja validação (ou estorno) gerou a última escrita do client
  atualizadoEm: Date;
}

// RF19: medalha conquistada, em usuarios/{alunoId}/medalhas/{marcoId} (id == id do marco em
// MARCOS_MEDALHAS). Escrita só pela Cloud Function (functions/src/medalhas.ts), nunca pelo client.
// Não é apagada se a contagem cair depois (estorno, sequência quebrada).
export interface MedalhaConquistada {
  id: string;
  tipo: 'treinos' | 'sequencia' | 'graduacoes';
  quantidade: number;
  rotulo: string;
  conquistadaEm: Timestamp;
  origem: 'checkin' | 'graduacao' | 'migracao'; // 'migracao': data reconstruída do histórico
  registradaEm: Timestamp;
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

// RF33: personalização da pontuação e dos níveis por academia ou professor autônomo. Um documento
// por responsável, id == responsavelId. Sem documento, valem os padrões de src/config/gamificacao.ts.
export interface ConfiguracaoGamificacao {
  id: string;
  responsavelId: string;
  pontosPorCheckin: number;   // RF16, RN01: pontos de cada check-in validado
  pontosPorMissao: number;    // RF23: valor sugerido ao criar uma missão
  niveisXp: number[];         // RF17: XP acumulado para completar cada nível, crescente
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
