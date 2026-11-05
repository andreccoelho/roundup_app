// Acesso por REST aos emuladores de Auth, Storage e Functions — só os testes de Cloud Functions
// usam. Os endpoints são os documentados para o Firebase Local Emulator Suite; a chave de API é
// qualquer string, o emulador de Auth não a valida.
import { PROJECT_ID } from '../rules/helpers';

const AUTH = 'http://127.0.0.1:9099';
const STORAGE = 'http://127.0.0.1:9199';
const FUNCTIONS = `http://127.0.0.1:5001/${PROJECT_ID}/us-central1`;
export const BUCKET = `${PROJECT_ID}.appspot.com`;

export interface ContaTeste {
  uid: string;
  idToken: string;
}

export async function criarConta(email: string): Promise<ContaTeste> {
  const resposta = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=chave-teste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'senha-teste-123', returnSecureToken: true }),
  });
  const corpo = await resposta.json();
  if (!resposta.ok) throw new Error(`signUp falhou: ${JSON.stringify(corpo)}`);
  return { uid: corpo.localId, idToken: corpo.idToken };
}

export async function contaExiste(idToken: string): Promise<boolean> {
  const resposta = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:lookup?key=chave-teste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  return resposta.ok;
}

export async function limparContas(): Promise<void> {
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' });
}

function caminhoArquivo(caminho: string): string {
  return `${STORAGE}/v0/b/${BUCKET}/o/${encodeURIComponent(caminho)}`;
}

export async function enviarArquivo(conta: ContaTeste, caminho: string): Promise<void> {
  const resposta = await fetch(`${STORAGE}/v0/b/${BUCKET}/o?name=${encodeURIComponent(caminho)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg', Authorization: `Firebase ${conta.idToken}` },
    body: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
  });
  if (!resposta.ok) throw new Error(`upload falhou: ${resposta.status} ${await resposta.text()}`);
}

export async function arquivoExiste(conta: ContaTeste, caminho: string): Promise<boolean> {
  const resposta = await fetch(caminhoArquivo(caminho), {
    headers: { Authorization: `Firebase ${conta.idToken}` },
  });
  return resposta.ok;
}

// Protocolo de callable: POST com { data } e o ID token no Authorization
export async function chamarFuncao<T = unknown>(
  nome: string,
  dados: unknown,
  idToken?: string,
): Promise<{ ok: boolean; resultado?: T; erro?: { status: string; message: string } }> {
  const resposta = await fetch(`${FUNCTIONS}/${nome}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ data: dados }),
  });
  const corpo = await resposta.json();
  return resposta.ok ? { ok: true, resultado: corpo.result } : { ok: false, erro: corpo.error };
}

// As Cloud Functions rodam de forma assíncrona em reação ao gatilho — não há como "esperar"
// de outro jeito a não ser sondar o resultado esperado com um tempo limite.
export async function aguardar(condicao: () => Promise<boolean>, tentativas = 20, intervaloMs = 500): Promise<void> {
  for (let i = 0; i < tentativas; i += 1) {
    if (await condicao()) return;
    await new Promise((resolve) => setTimeout(resolve, intervaloMs));
  }
  throw new Error('Condição não satisfeita a tempo — a Cloud Function não reagiu (ou não está rodando).');
}
