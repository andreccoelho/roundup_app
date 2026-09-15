// RF10, RF12, RF26: rotas da aba Turmas, compartilhadas entre ProfessorTabs e AcademiaTabs
// (GestorTabsCompartilhado.tsx). Solicitações (RF07) vive na aba Perfil de cada raiz — ver
// ProfessorTabs.tsx/AcademiaTabs.tsx.
export type GestorStackParamList = {
  Turmas: undefined;
  TurmaDetalhe: { turmaId: string };
  SessaoDetalhe: { sessaoId: string };
  RelatorioFrequencia: { turmaId: string };
};
