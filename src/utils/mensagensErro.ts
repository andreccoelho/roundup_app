// RF02: mapeia códigos de erro do Firebase Auth para mensagens em pt-BR — usado por Login,
// RecuperarSenha e pelos 3 formulários de cadastro para o erro de autenticação/conta.
export function mensagemErroAutenticacao(codigo: string | undefined): string {
  switch (codigo) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Tente entrar em vez de criar uma nova conta.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/weak-password':
      return 'Senha muito fraca. Use ao menos 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde um momento e tente novamente.';
    case 'auth/network-request-failed':
      return 'Falha de conexão. Verifique sua internet e tente novamente.';
    default:
      return 'Não foi possível concluir a operação. Tente novamente.';
  }
}

// RF01: erro de gravação em `usuarios` (Firestore) depois que a conta já existe no Auth —
// código não começa com 'auth/', é assim que as telas separam essa mensagem da anterior.
export function ehErroDeAutenticacao(erro: unknown): boolean {
  const codigo = (erro as { code?: string })?.code;
  return typeof codigo === 'string' && codigo.startsWith('auth/');
}

export const MENSAGEM_ERRO_PERSISTENCIA =
  'Sua conta foi criada, mas houve um problema ao salvar seus dados. Verifique sua conexão e tente novamente.';
