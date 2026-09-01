## Contexto do projeto

RoundUp é um aplicativo mobile de gamificação para academias de luta, TCC de Engenharia da Computação. Stack: React Native + Expo (SDK 57) + Firebase (Auth, Firestore, Storage), TypeScript.

O modelo de atores é central: três perfis, **Academia**, **Professor** e **Aluno**. Professores podem atuar de forma autônoma ou vinculados a uma academia; alunos sempre precisam de um vínculo ativo (com academia ou com professor autônomo). Isso deve se refletir na navegação, nos tipos e nas regras de acesso.

O `package.json` já tem instalado: `firebase`, `@react-native-async-storage/async-storage`, `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`, `expo-image-picker`, `expo-notifications`.

A estrutura de pastas já existe, mas está vazia:
```
src/
  navigation/
  screens/
    auth/
    aluno/
    professor/
    academia/
  components/
  services/
  contexts/
  types/
  constants/
```

## O que criar

### 1. `src/types/`
Interfaces TypeScript para as entidades abaixo (um arquivo por entidade ou um `index.ts` único, como preferir organizar):
`Usuario` (com campo `perfil: 'academia' | 'professor' | 'aluno'`), `Vinculo`, `Turma`, `Sessao`, `CheckIn`, `Missao`, `MissaoProgresso`, `Graduacao`, `ConfiguracaoGamificacao`, `ConsentimentoLGPD`.

Use nomes de campos em português, coerentes com a documentação do TCC (ex.: `nome`, `modalidade`, `responsavelId`, `dataHoraInicio`).

### 2. `src/services/firebase.ts`
Inicializar o app do Firebase lendo a configuração de variáveis de ambiente `EXPO_PUBLIC_FIREBASE_*` (não hardcodar credenciais). Exportar `auth`, `db` (Firestore) e `storage`.

Para o Auth em React Native, usar:
```ts
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
```
Se o TypeScript reclamar que `getReactNativePersistence` não existe em `firebase/auth` (é um problema conhecido de tipagem do editor, o Metro resolve certo em runtime), resolva com um comentário `// @ts-ignore` na linha do import, não reescreva a inicialização por causa disso.

Criar também um `.env.example` (sem valores reais, só os nomes das chaves) e confirmar que `.env` está no `.gitignore`.

### 3. `src/services/` (um arquivo por entidade)
`usuarios.ts`, `vinculos.ts`, `turmas.ts`, `sessoes.ts`, `checkins.ts`, `missoes.ts`, `graduacoes.ts`, `configuracoesGamificacao.ts`, `consentimentosLGPD.ts`.

Cada um com funções CRUD básicas usando o SDK modular do Firestore (`getDoc`, `setDoc`, `updateDoc`, `query`/`where` para listagens por escopo de vínculo). Sem lógica de negócio completa ainda, só o esqueleto que compila e é reaproveitável pelas telas.

### 4. `src/contexts/AuthContext.tsx`
Contexto com o usuário autenticado (via `onAuthStateChanged`), o perfil ativo, e funções `login`, `logout`, `cadastrar`. Deve envolver o `App.tsx`.

### 5. `src/navigation/`
- `AuthStack.tsx`: telas de login, cadastro e recuperação de senha.
- `AlunoStack.tsx`, `ProfessorStack.tsx`, `AcademiaStack.tsx`: cada uma com uma tela inicial placeholder (dashboard) por enquanto.
- `RootNavigator.tsx`: decide qual stack mostrar com base no estado de autenticação e no perfil do `AuthContext`.

### 6. `src/screens/`
Um componente placeholder simples por pasta (`auth/LoginScreen.tsx`, `auth/CadastroScreen.tsx`, `auth/RecuperarSenhaScreen.tsx`, e um `DashboardScreen.tsx` em cada uma de `aluno/`, `professor/`, `academia/`), só para a navegação ter algo para renderizar.

### 7. `src/components/`
Um componente compartilhado simples, tipo `LoadingScreen.tsx`, usado enquanto o estado de autenticação carrega.

### 8. `src/constants/`
`colors.ts` com a paleta monocromática (preto, branco, cinza) já definida na identidade visual do projeto. Não presumir que a fonte Homebase Regular já está nos assets, só deixar o arquivo de tipografia preparado para receber ela depois.

## Regras de código
- Comentar os arquivos de services e types referenciando o código do requisito correspondente (ex.: `// RF13, RN02: check-in único por sessão`), para manter rastreabilidade com a lista de requisitos do TCC.
- TypeScript com tipagem explícita, evitar `any`.
- Nomes de domínio (entidades, coleções, campos) em português; nomes de componentes e funções seguem convenção usual de React/TypeScript.

## O que não fazer agora
- Não implementar regras de negócio completas (validação de check-in, cálculo de pontos, ranking).
- Não criar o projeto no console do Firebase nem preencher credenciais reais, isso é manual e já será feito à parte.
- Não escrever regras de segurança do Firestore ainda, isso é uma etapa separada.

## Entrega esperada
Ao final, listar os arquivos criados e confirmar que o projeto builda sem erro de import (`npx tsc --noEmit`).