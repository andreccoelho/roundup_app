// RF10, RF12: rotas de gestor compartilhadas entre ProfessorStack e AcademiaStack
export type GestorStackParamList = {
  Turmas: undefined;
  TurmaDetalhe: { turmaId: string };
  SessaoDetalhe: { sessaoId: string };
};
