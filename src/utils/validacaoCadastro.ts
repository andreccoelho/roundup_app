// RF01: validações de formulário compartilhadas pelos 3 cadastros (aluno/professor/academia)
// e pelo login — separadas de erro de autenticação/persistência, que vêm do Firebase.
export const TAMANHO_MINIMO_SENHA = 6;

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function senhaValida(senha: string): boolean {
  return senha.length >= TAMANHO_MINIMO_SENHA;
}

// RF04, RF05, RF06: modalidade(s) selecionada(s), com "Outra" substituída pelo texto livre —
// nunca salva o rótulo genérico "Outra" no Firestore.
export function resolverModalidades(selecionadas: string[], outraTexto: string, outraLabel: string): string[] {
  const semOutra = selecionadas.filter((m) => m !== outraLabel);
  const outraPreenchida = selecionadas.includes(outraLabel) && outraTexto.trim().length > 0;
  return outraPreenchida ? [...semOutra, outraTexto.trim()] : semOutra;
}
