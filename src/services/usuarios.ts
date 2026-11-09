// RF01, RF02, RF03, RF04, RF05, RF06: CRUD de usuários
// RNF04: `usuarios/{uid}` raiz é legível por qualquer autenticado, então email, dataNascimento e
// responsavelLegal ficam em usuarios/{uid}/privado/dados (só o dono lê) — ver DadosPessoaisPrivados.
import {
  doc, getDoc, updateDoc, deleteDoc, deleteField, writeBatch,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { DadosPessoaisPrivados, Usuario } from '../types';

const COLECAO = 'usuarios';
const CAMPOS_PESSOAIS = ['email', 'dataNascimento', 'responsavelLegal'] as const;

function refDadosPrivados(id: string) {
  return doc(db, COLECAO, id, 'privado', 'dados');
}

// Separa o que vai para o documento público do que vai para o privado
function separarDados(usuario: Usuario): { publico: Omit<Usuario, 'email' | 'dataNascimento' | 'responsavelLegal'>; privado: DadosPessoaisPrivados } {
  const { email, dataNascimento, responsavelLegal, ...publico } = usuario;
  const privado: DadosPessoaisPrivados = { email: email ?? '' };
  if (dataNascimento) privado.dataNascimento = dataNascimento;
  if (responsavelLegal) privado.responsavelLegal = responsavelLegal;
  return { publico, privado };
}

// RF05, RN06: professor nasce autônomo — o vínculo com academia é opcional
export async function criarUsuario(usuario: Usuario): Promise<void> {
  const completo: Usuario = usuario.perfil === 'professor'
    ? { ...usuario, autonomo: usuario.autonomo ?? true }
    : usuario;
  const { publico, privado } = separarDados(completo);
  // Atômico: ou nascem os dois documentos, ou nenhum
  const lote = writeBatch(db);
  lote.set(doc(db, COLECAO, usuario.id), publico);
  lote.set(refDadosPrivados(usuario.id), privado);
  await lote.commit();
}

// Documento público de qualquer usuário — sem email, nascimento nem responsável legal
export async function buscarUsuario(id: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, COLECAO, id));
  return snap.exists() ? (snap.data() as Usuario) : null;
}

// Só para o usuário logado (as regras negam privado/dados a qualquer outro): documento público +
// dados pessoais já mesclados, que é o que as telas de perfil esperam.
export async function buscarMeuUsuario(id: string): Promise<Usuario | null> {
  const [publico, privado] = await Promise.all([getDoc(doc(db, COLECAO, id)), getDoc(refDadosPrivados(id))]);
  if (!publico.exists()) return null;
  const dadosPublicos = publico.data() as Usuario;
  const dadosPrivados = privado.exists() ? (privado.data() as Partial<DadosPessoaisPrivados>) : {};
  // Em caso de conflito vale o privado (é o destino da migração, e o que o usuário edita hoje)
  const usuario: Usuario = { ...dadosPublicos, ...dadosPrivados };
  await migrarCamposLegados(id, dadosPublicos, dadosPrivados);
  return usuario;
}

// RNF04: contas criadas antes da separação ainda têm email/dataNascimento/responsavelLegal no
// documento raiz, que qualquer autenticado lê. Cada usuário move os próprios campos no login (só
// ele pode escrever nos dois documentos); o script scripts/migrar-dados-pessoais.cjs faz o mesmo
// para todo mundo de uma vez, com credenciais Admin. Falha aqui nunca derruba o login: o usuário
// só continua com o dado no lugar antigo até o próximo acesso.
async function migrarCamposLegados(
  id: string,
  publico: Usuario,
  privado: Partial<DadosPessoaisPrivados>,
): Promise<void> {
  const legados = CAMPOS_PESSOAIS.filter((campo) => publico[campo] !== undefined);
  if (legados.length === 0) return;
  try {
    const paraPrivado: Record<string, unknown> = {};
    legados.forEach((campo) => { paraPrivado[campo] = privado[campo] ?? publico[campo]; });
    const lote = writeBatch(db);
    lote.set(refDadosPrivados(id), paraPrivado, { merge: true });
    lote.update(doc(db, COLECAO, id), Object.fromEntries(legados.map((campo) => [campo, deleteField()])));
    await lote.commit();
  } catch (e) {
    console.warn('migração de dados pessoais falhou (tenta de novo no próximo login):', e);
  }
}

export async function atualizarUsuario(id: string, dados: Partial<Usuario>): Promise<void> {
  await updateDoc(doc(db, COLECAO, id), dados);
}

export async function removerUsuario(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO, id));
}

export async function listarUsuariosPorPerfil(perfil: Usuario['perfil']): Promise<Usuario[]> {
  const q = query(collection(db, COLECAO), where('perfil', '==', perfil));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Usuario);
}
