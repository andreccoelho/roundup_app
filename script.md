# Prompt para Claude Code — Verificação completa do fluxo de cadastro/login

Cole o bloco abaixo como instrução no Claude Code, dentro do repositório `roundup_app`.

---

## Contexto

O RoundUp é um app React Native + Expo + Firebase (Auth, Firestore, Storage), com três perfis de usuário: `academia`, `professor`, `aluno`.

Foi identificado um bug: a função `cadastrar` em `src/contexts/AuthContext.tsx` cria a credencial no Firebase Auth, mas nunca grava o documento correspondente na coleção `usuarios` do Firestore. Resultado: o usuário aparece em Authentication → Users no console, mas não existe nenhum documento em `usuarios/{uid}`.

Código atual de `src/contexts/AuthContext.tsx`:
```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { buscarUsuario } from '../services/usuarios';
import { Usuario } from '../types';

interface AuthContextData {
  usuarioAuth: User | null;
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (email: string, senha: string) => Promise<User>;
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

  async function cadastrar(email: string, senha: string): Promise<User> {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    return credencial.user;
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
```

## Tarefa

Fazer uma auditoria completa do fluxo de cadastro/login, não só corrigir o sintoma pontual. Percorrer:

### 1. `src/types/` (interface `Usuario`)
Conferir se já existe `perfil: 'academia' | 'professor' | 'aluno'`, `nome`, `email`, `criadoEm`. Se algum campo essencial estiver faltando para o cadastro (RF01), ajustar a interface.

### 2. `src/services/usuarios.ts`
Verificar se já existe uma função de criação do documento (`criarUsuario` ou nome equivalente) usando `setDoc` do Firestore modular. Se não existir, criar. Ela deve gravar em `usuarios/{uid}` com os mesmos campos definidos em `types/Usuario`. Reaproveitar `buscarUsuario`, que já existe, sem duplicar lógica de acesso ao Firestore.

### 3. `src/contexts/AuthContext.tsx`
Corrigir `cadastrar` para:
- Receber `perfil: Usuario['perfil']` e `nome: string` como parâmetros, além de `email` e `senha`.
- Depois de criar a credencial no Auth, chamar a função de criação do Firestore com esses dados.
- Se a escrita no Firestore falhar depois do Auth já ter criado o usuário, isso precisa ficar visível (lançar o erro adiante, não engolir silenciosamente). Não é necessário implementar rollback do usuário do Auth nessa fase, só não esconder a falha.
- Atualizar o estado `usuario` do contexto com os dados recém-criados logo após o cadastro, sem depender de esperar o próximo disparo de `onAuthStateChanged`.

### 4. Tela de cadastro/teste
Ajustar a chamada de `cadastrar` para passar `perfil` e `nome` (pode ser um seletor simples entre aluno/professor/academia, mesmo que rudimentar, só para validar o fluxo).

### 5. `RootNavigator` (ou equivalente em `src/navigation/`)
Confirmar que a decisão de qual stack mostrar (`AlunoStack`, `ProfessorStack`, `AcademiaStack`, `AuthStack`) usa `usuario?.perfil` do contexto, não apenas `usuarioAuth`. Confirmar que o estado `carregando` é respeitado, para não piscar a tela errada antes do perfil terminar de carregar.

## Sobre as regras do Firestore (não mexer agora)

As regras de segurança do projeto ainda não foram escritas, o banco está em modo de produção padrão, que nega toda leitura e escrita. Isso significa que, ao testar o cadastro corrigido, a escrita em `usuarios/{uid}` provavelmente vai falhar com `permission-denied`, mesmo com o código certo. Isso é esperado nessa fase e não indica um bug no código corrigido.

Não escreva as regras de segurança definitivas como parte dessa tarefa, é uma etapa separada. Se quiser desbloquear o teste agora, aplique manualmente essa regra temporária no console (aba Regras do Firestore), e ela será substituída depois pela versão definitiva:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{usuarioId} {
      allow read, write: if request.auth != null && request.auth.uid == usuarioId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Teste esperado ao final

- Criar um usuário de teste com perfil definido.
- Confirmar que aparece em Authentication → Users **e** em Firestore → `usuarios/{uid}`, com o campo `perfil` correto.
- Fazer logout e login de novo, confirmar que o app carrega o perfil salvo sem pedir para escolher de novo.
- Rodar `npx tsc --noEmit` sem erros.

## Entrega esperada

Listar os arquivos alterados ou criados, e um resumo objetivo do que foi corrigido em cada um.