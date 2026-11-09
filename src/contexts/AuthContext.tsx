import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../services/firebase';
import { atualizarUsuario, buscarMeuUsuario, criarUsuario } from '../services/usuarios';
import { registrarDispositivo, desregistrarDispositivo } from '../services/notificacoes';
import { Usuario } from '../types';
import { agoraTimestamp } from '../utils/datas';

// RF01: campos que cada tela de cadastro (aluno/professor/academia) monta antes de chamar
// cadastrar() — tudo que não é resolvido pelo próprio fluxo de criação da conta.
type DadosPerfilCadastro = Omit<Usuario, 'id' | 'email' | 'criadoEm' | 'atualizadoEm'>;

interface AuthContextData {
  usuarioAuth: User | null;
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (email: string, senha: string, dadosPerfil: DadosPerfilCadastro) => Promise<Usuario>;
  logout: () => Promise<void>;
  excluirConta: () => Promise<void>;
  // RF06: edição de perfil (nome, faixa/graduação, modalidades, foto) — nunca aceita mudar
  // `perfil`, `email` ou `id` (firestore.rules trava perfil; email é RF separado, precisa
  // reautenticação no Firebase Auth, fora de escopo aqui).
  atualizarPerfil: (dados: Partial<Omit<Usuario, 'id' | 'email' | 'perfil' | 'criadoEm'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuarioAuth, setUsuarioAuth] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUsuarioAuth(user);
      if (user) {
        // RNF04: email, nascimento e responsável legal vêm de privado/dados (só o dono lê)
        const dadosUsuario = await buscarMeuUsuario(user.uid);
        setUsuario(dadosUsuario);
        // RF31: registro do aparelho para push — falha (Expo Go, web, permissão negada) não
        // interfere no login
        registrarDispositivo(user.uid).catch((e) => console.warn('registrarDispositivo falhou:', e));
      } else {
        setUsuario(null);
      }
      setCarregando(false);
    });
    return unsubscribe;
  }, []);

  async function login(email: string, senha: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, senha);
  }

  async function cadastrar(
    email: string,
    senha: string,
    dadosPerfil: DadosPerfilCadastro
  ): Promise<Usuario> {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    const agora = agoraTimestamp();
    const novoUsuario: Usuario = {
      id: credencial.user.uid,
      email,
      criadoEm: agora,
      atualizadoEm: agora,
      ...dadosPerfil,
    };

    // Erro aqui (ex.: rede caiu logo após criar a conta no Auth) tem código diferente de
    // 'auth/*' — é assim que as telas de cadastro distinguem falha de persistência de falha
    // de autenticação, sem precisar de uma classe de erro dedicada.
    await criarUsuario(novoUsuario);

    setUsuario(novoUsuario);
    return novoUsuario;
  }

  async function logout(): Promise<void> {
    await desregistrarDispositivo();
    await signOut(auth);
  }

  // RF29: exclusão de conta e dados. Toda a limpeza (documentos do usuário em todas as coleções,
  // foto no Storage e, por último, a conta no Firebase Auth) roda na Cloud Function excluirConta
  // (functions/src/exclusaoConta.ts), com Admin SDK — o client não tem permissão para apagar
  // nada disso sozinho (`usuarios.delete` continua negado em firestore.rules). Se a função
  // falhar, a conta não é removida e o erro sobe para a tela, que mostra o Aviso fixo.
  async function excluirConta(): Promise<void> {
    if (!auth.currentUser || !usuario) {
      throw new Error('Nenhum usuário autenticado.');
    }
    await httpsCallable(functions, 'excluirConta')();
    // A conta já não existe no Auth, mas o token local ainda vale até expirar — sair limpa a
    // sessão e o RootNavigator volta para o login.
    await signOut(auth);
  }

  async function atualizarPerfil(
    dados: Partial<Omit<Usuario, 'id' | 'email' | 'perfil' | 'criadoEm'>>
  ): Promise<void> {
    if (!usuario) {
      throw new Error('Nenhum usuário autenticado.');
    }
    const comCarimbo = { ...dados, atualizadoEm: agoraTimestamp() };
    await atualizarUsuario(usuario.id, comCarimbo);
    setUsuario((atual) => (atual ? { ...atual, ...comCarimbo } : atual));
  }

  return (
    <AuthContext.Provider
      value={{ usuarioAuth, usuario, carregando, login, cadastrar, logout, excluirConta, atualizarPerfil }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  return useContext(AuthContext);
}
