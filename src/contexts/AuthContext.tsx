import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { buscarUsuario, criarUsuario } from '../services/usuarios';
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
        const dadosUsuario = await buscarUsuario(user.uid);
        setUsuario(dadosUsuario);
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
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ usuarioAuth, usuario, carregando, login, cadastrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  return useContext(AuthContext);
}
