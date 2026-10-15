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

// Erro genérico de qualquer chamada (Firestore, Storage, Auth ou regra de negócio dos services) →
// mensagem em pt-BR para a tela. Substitui o `setErro(e.message)` cru, que mostrava ao usuário o
// texto técnico do Firebase em inglês (RELATORIO_UI_UX.md, UX-10).
// - Erros do Firebase têm `code` ("permission-denied", "storage/unauthorized", "auth/..."):
//   traduzidos aqui.
// - Erros lançados pelos próprios services (`throw new Error('Sessão não encontrada.')`) não têm
//   `code` e já vêm em português: a mensagem é preservada.
export function mensagemErro(erro: unknown, padrao = 'Não foi possível carregar agora. Tente novamente.'): string {
  const codigo = (erro as { code?: unknown })?.code;
  if (typeof codigo === 'string' && codigo.length > 0) {
    if (codigo.startsWith('auth/')) return mensagemErroAutenticacao(codigo);
    switch (codigo.replace(/^(firestore|storage|functions)\//, '')) {
      case 'permission-denied':
      case 'unauthorized':
        return 'Você não tem permissão para acessar isso.';
      case 'unauthenticated':
        return 'Sua sessão expirou. Entre novamente.';
      case 'unavailable':
      case 'deadline-exceeded':
      case 'retry-limit-exceeded':
        return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
      case 'not-found':
      case 'object-not-found':
        return 'Não encontramos esse registro. Ele pode ter sido removido.';
      case 'already-exists':
        return 'Esse registro já existe.';
      case 'resource-exhausted':
      case 'quota-exceeded':
        return 'Muitas solicitações seguidas. Aguarde um momento e tente novamente.';
      case 'canceled':
        return 'Operação cancelada.';
      default:
        return padrao;
    }
  }
  const mensagem = (erro as { message?: unknown })?.message;
  // Mensagem de negócio dos services: `throw new Error('...')` puro (não TypeError de rede etc.).
  if (erro instanceof Error && erro.constructor === Error && typeof mensagem === 'string' && mensagem.length > 0 && mensagem.length < 160) {
    return mensagem;
  }
  return padrao;
}
