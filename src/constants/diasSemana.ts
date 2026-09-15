// RF10, RF12: dias da semana da grade recorrente, compartilhado entre a criação de turma
// (TurmasScreen) e a criação de sessão (TurmaDetalheScreen) — valor alinhado a Date#getDay()
// (0=domingo .. 6=sábado), começando a lista na segunda por ser o início real da semana de treino.
export const DIAS_SEMANA: { valor: number; rotulo: string }[] = [
  { valor: 1, rotulo: 'Seg' },
  { valor: 2, rotulo: 'Ter' },
  { valor: 3, rotulo: 'Qua' },
  { valor: 4, rotulo: 'Qui' },
  { valor: 5, rotulo: 'Sex' },
  { valor: 6, rotulo: 'Sáb' },
  { valor: 0, rotulo: 'Dom' },
];
