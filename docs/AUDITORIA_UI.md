# Auditoria de UI — RoundUp

Passo 0 do `SCRIPT.md`. Leitura completa do repositório em `dev`, antes de qualquer código de interface. Não há `app/` (Expo Router) neste projeto — toda a navegação é React Navigation, em `src/navigation/`.

---

## 0. Conflitos encontrados (leia antes do resto)

O `SCRIPT.md` pede para apontar, e não resolver, qualquer conflito entre a direção visual descrita nele e o que já existe no repositório. Há três conflitos reais, não cosméticos:

1. **Dois documentos de direção visual divergentes.** `DESIGN_BRIEF.md` (raiz do repo) já é a especificação visual em vigor — e o código existente a implementa, não ao `SCRIPT.md`:
   - Paleta: `DESIGN_BRIEF.md`/`src/constants/colors.ts` usam preto `#0A0A0A` / branco / cinzas, com **duas** cores funcionais (`checkinValidado` verde, `alerta` vermelho) e proíbem explicitamente qualquer acento decorativo, "nem o verde/vermelho semântico deve virar tema". O `SCRIPT.md` pede fundo `#0C0C0D`, define uma escala de superfícies (`surface`, `surfaceRaised`, `line`) que não existe hoje, e introduz um **terceiro** tratamento de cor — `brass` `#C9A227`, acento único para toda progressão (XP, nível, faixa, medalha, sequência) — que o `DESIGN_BRIEF.md` não prevê e que a paleta atual não tem onde encaixar sem contradizer a regra "cor só para status funcional".
   - Tipografia: `DESIGN_BRIEF.md`/`src/constants/typography.ts` já adotaram Oswald (`@expo-google-fonts/oswald`, carregada em `App.tsx`) como fonte de placar/números, com Homebase reservada para corpo de texto quando o asset existir. O `SCRIPT.md` inverte o papel — Homebase como display de títulos e números grandes, Inter (via `expo-font`) para o resto — e não há asset de Homebase em nenhum lugar do repositório (busquei por `*.ttf`/`*.otf`/"homebase": nenhum resultado). Sem esse arquivo de fonte, a direção do `SCRIPT.md` não é executável como está escrita.
   - Forma: `DESIGN_BRIEF.md` pede explicitamente que cards **não** tenham tratamento uniforme ("pare de repetir card branco com borda cinza e raio 12 em tudo"). `SCRIPT.md` define exatamente esse padrão único (raio 12, borda 1px em `line`) como regra geral de cartão. Contraditório item a item.
   - Escala numérica: `SCRIPT.md` pede escala fixa 32/24/20/17/15/13 com variante tabular; `src/constants/typography.ts` já define uma escala diferente (12/14/16/20/24/32 + 48/64 para placar).

   Isso não é uma tela desatualizada — é a fundação inteira (`src/constants/colors.ts`, `src/constants/typography.ts`, `src/components/icones/index.tsx`, `App.tsx`) construída sobre a leitura de `DESIGN_BRIEF.md`. Qualquer decisão de qual dos dois documentos prevalece precisa vir de você antes do Passo 1.

2. **Botão de teste temporário em `DashboardScreen.tsx`: não encontrado.** O `SCRIPT.md` (critério de aceite e item 7 da auditoria) presume a existência de um botão de teste temporário nessa tela. Busquei por `teste`/`TESTE`/`TODO`/`FIXME`/`debug` em `src/` inteiro e li as três `DashboardScreen.tsx` (aluno, professor, academia) linha a linha: nenhuma tem botão de teste, código morto ou chamada de depuração. Ou já foi removido em um commit anterior, ou a premissa do prompt não corresponde ao estado atual do código — sinalizando em vez de inventar um item de limpeza que não existe.

3. **Navegação por abas ainda não existe.** O `SCRIPT.md` (Passo 3) descreve duas raízes por abas (Aluno: Treinar/Agenda/Missões/Classificação/Perfil; Gestor: Hoje/Turmas/Alunos/Missões/Perfil). Hoje `AlunoStack`, `ProfessorStack` e `AcademiaStack` são `createNativeStackNavigator` puros, sem `createBottomTabNavigator` em lugar nenhum do projeto (não há a dependência `@react-navigation/bottom-tabs` no `package.json`). Isso não é uma dívida a corrigir agora — é só um dado necessário para dimensionar o Passo 3: a navegação por abas é trabalho novo, não refatoração de tabs existentes, e vai exigir adicionar essa dependência (pedido de aprovação, por "Restrições técnicas" do `SCRIPT.md`).

---

## 1. Árvore de diretórios relevante

```
App.tsx                        — bootstrap: carrega fontes Oswald, gate de SplashScreen, monta AuthProvider + RootNavigator
index.ts                       — entrypoint Expo (registerRootComponent)

src/
  components/
    LinhaFina.tsx               — separador de lista (substitui "card com borda")
    LoadingScreen.tsx           — spinner de tela cheia (usado só pelo RootNavigator)
    icones/index.tsx            — 8 ícones SVG do "universo de luta" (luva, sino, cadeado, corda, faixa, poste...)
    ui/
      Botao.tsx                 — variantes 'primario' | 'texto'
      CampoTexto.tsx            — input sublinhado com rótulo e erro
      ModalitySelector.tsx      — pílulas de seleção múltipla de modalidade

  constants/
    colors.ts                   — paleta (ver conflito #1)
    typography.ts                — FontFamily/FontSize (ver conflito #1)
    modalidades.ts               — lista compartilhada pelos 3 cadastros
    regras.ts                    — MINUTOS_ABERTURA_CHECKIN_ANTES_DO_INICIO, LIMITE_CLAUSULA_IN

  contexts/
    AuthContext.tsx              — usuarioAuth (Firebase Auth) + usuario (Firestore), login/cadastrar/logout

  navigation/
    RootNavigator.tsx            — escolhe stack pela `usuario.perfil`
    AuthStack.tsx                — Login, RecuperarSenha, SelecaoPerfil, 3 telas de Cadastro
    AlunoStack.tsx                — Dashboard, VincularAluno, TurmasDisponiveis, Agenda, Historico
    ProfessorStack.tsx           — Dashboard, VincularProfessor, SolicitacoesProfessor + rotas de GestorStackParamList
    AcademiaStack.tsx            — Dashboard, SolicitacoesAcademia + rotas de GestorStackParamList
    types.ts                     — GestorStackParamList (Turmas, TurmaDetalhe, SessaoDetalhe), compartilhado

  screens/
    auth/      LoginScreen, RecuperarSenhaScreen, SelecaoPerfilScreen, CadastroAlunoScreen, CadastroProfessorScreen, CadastroAcademiaScreen
    aluno/     DashboardScreen, AgendaScreen, HistoricoScreen, TurmasDisponiveisScreen, VincularAlunoScreen
    professor/ DashboardScreen, SolicitacoesProfessorScreen, VincularProfessorScreen
    academia/  DashboardScreen, SolicitacoesAcademiaScreen
    gestor/    TurmasScreen, TurmaDetalheScreen, SessaoDetalheScreen  (compartilhadas por Professor e Academia)

  services/    firebase, usuarios, vinculos, turmas, matriculas, sessoes, checkins, missoes, graduacoes,
               configuracoesGamificacao, consentimentosLGPD, firestoreSeguro
  types/index.ts                — todos os tipos de domínio (ver seção 5)
  utils/       datas, statusCheckIn, validacaoCadastro, mensagensErro

functions/src/index.ts          — Cloud Functions (sincronização de leitoresIds) — fora do escopo de UI
firestore.rules, firestore.indexes.json — regras de segurança — fora do escopo de UI
tests/                          — testes de regras (emulador) e de function — fora do escopo de UI
docs/
  requisitos/requisitos-v1-2026-09.csv  — lista oficial de RF/RN/RNF, códigos usados neste documento
  wireframes/*.pdf (17 arquivos) — referência funcional/navegação, não visual (ver DESIGN_BRIEF.md linha 5)
  decisoes-tecnicas.md, roteiro-teste-ciclo1.md — decisões de backend/regras, não de UI
DESIGN_BRIEF.md                 — briefing visual já em vigor (ver conflito #1)
```

Não existem diretórios `src/theme/`, `src/components/ui/` além dos 3 componentes listados, nem `src/screens/dev/` — todos alvos do Passo 1/2 do `SCRIPT.md`, a criar do zero.

---

## 2. Inventário de telas existentes

| Arquivo | Ator | Requisito | Estado |
|---|---|---|---|
| `screens/auth/LoginScreen.tsx` | todos | RF02 | Funcional |
| `screens/auth/RecuperarSenhaScreen.tsx` | todos | RF02 | Funcional |
| `screens/auth/SelecaoPerfilScreen.tsx` | todos | RF01 | Funcional |
| `screens/auth/CadastroAlunoScreen.tsx` | Aluno | RF01, RF06 | Funcional |
| `screens/auth/CadastroProfessorScreen.tsx` | Professor | RF01, RF05 | Funcional |
| `screens/auth/CadastroAcademiaScreen.tsx` | Academia | RF01, RF04 | Funcional |
| `screens/aluno/DashboardScreen.tsx` | Aluno | RF14 (+ check-in inline, RF13) | Funcional — sem XP/sequência/missões/ranking (RF16–RF21, Ciclo 2, bloqueados em `firestore.rules`) |
| `screens/aluno/AgendaScreen.tsx` | Aluno | RF13, RF14, RN02, RN08, RNF01 | Funcional — praticamente duplica a lógica do Dashboard (ver seção 3) |
| `screens/aluno/HistoricoScreen.tsx` | Aluno | RF15 | Funcional, mas só tem estado de carregando/erro/vazio — sem "tentar novamente" no erro |
| `screens/aluno/TurmasDisponiveisScreen.tsx` | Aluno | RF11 | Funcional |
| `screens/aluno/VincularAlunoScreen.tsx` | Aluno | RF08 | Funcional — erros via `Alert.alert`, não inline |
| `screens/professor/DashboardScreen.tsx` | Professor | RF10, RF12, RF13/RN02/RN08 (chamada, adianta RF22) | Funcional — sem missões/graduações (Ciclo 3, bloqueado) |
| `screens/professor/SolicitacoesProfessorScreen.tsx` | Professor | RF07 (lado destinatário) | Funcional — erros via `Alert.alert` |
| `screens/professor/VincularProfessorScreen.tsx` | Professor | RF07 (lado solicitante) | Funcional — erros via `Alert.alert` |
| `screens/academia/DashboardScreen.tsx` | Academia | RF09 (parcial: turmas/professores/alunos vinculados; sem frequência, RF26 é Ciclo 3) | Funcional |
| `screens/academia/SolicitacoesAcademiaScreen.tsx` | Academia | RF07 (lado destinatário) | Funcional — quase idêntica a `professor/SolicitacoesProfessorScreen.tsx` (ver seção 3) |
| `screens/gestor/TurmasScreen.tsx` | Professor, Academia | RF10 | Funcional |
| `screens/gestor/TurmaDetalheScreen.tsx` | Professor, Academia | RF10, RF11 (leitura), RF12 | Funcional |
| `screens/gestor/SessaoDetalheScreen.tsx` | Professor, Academia | RF13 (janela), abrir/encerrar sessão | Funcional — sem validar/rejeitar check-in ainda (RF22, Ciclo 3) |

Nenhuma tela morta ou placeholder encontrada — todas as 18 têm lógica real ligada a services existentes. Não há telas para RF04/RF05/RF06 como **visualização/edição de perfil próprio** (só existem no formulário de cadastro) — não há `PerfilScreen` em nenhum dos 3 atores. O `SCRIPT.md` Ciclo 1 lista "perfis de academia, professor e aluno (RF04, RF05, RF06)" como telas a fazer — hoje esse requisito só é parcialmente atendido (defini-los no cadastro, não visualizá-los/editá-los depois).

---

## 3. Componentes reutilizáveis existentes e duplicação

**Reutilizáveis genéricos (`src/components/`, `src/components/ui/`):**
- `Botao` (primário/texto, com `carregando`/`desabilitado`) — usado nas 6 telas de `auth/` e nos 3 dashboards.
- `CampoTexto` — usado nas 6 telas de `auth/`.
- `ModalitySelector` — usado nos 3 cadastros (aluno/professor/academia).
- `LinhaFina` — usado em `aluno/DashboardScreen`, `aluno/AgendaScreen`, `academia/DashboardScreen`, `professor/DashboardScreen`, `auth/SelecaoPerfilScreen`.
- `LoadingScreen` — usado só em `RootNavigator` (troca de perfil/sessão), não dentro das telas (cada tela reimplementa seu próprio `<ActivityIndicator>` centralizado, ver seção 6).
- `icones/index.tsx` — 8 ícones (`IconeLuva`, `IconeSino`, `IconeCadeado`, `IconeCheck`, `IconeCorda`, `IconeCirculo`, `IconeFaixa`, `IconePoste`). Usados em `LoginScreen`, `SelecaoPerfilScreen`, `AgendaScreen`, `aluno/DashboardScreen`. `IconeSino` e `IconeCirculo` existem mas não são usados em lugar nenhum hoje.

**Duplicação clara entre telas** (candidatas a virar componentes de domínio no Passo 2):
1. **Lista de sessão com os 3 estados de check-in** (`disponivel`/`foraDaJanela`/`realizado`, ícone + selo): implementada quase identicamente em `aluno/DashboardScreen.tsx` (`CardCheckIn`) e `aluno/AgendaScreen.tsx` (`ItemSessao`) — mesma lógica, mesmo uso de `estadoCheckIn`/`motivoJanelaFechada`, JSX e nomes de estilo diferentes. É o `BotaoCheckIn`/`CartaoSessao` do Passo 2.
2. **Tela de solicitações pendentes** (`professor/SolicitacoesProfessorScreen.tsx` e `academia/SolicitacoesAcademiaScreen.tsx`): arquivos praticamente idênticos (mesma estrutura, mesmos estilos, só o texto de fallback do nome muda). Uma única tela parametrizada por perfil do destinatário resolveria as duas.
3. **Chip de seleção** (nível de turma em `TurmasScreen`, dias da semana em `TurmaDetalheScreen`, turma ativa em `professor/DashboardScreen`): três implementações inline de estilo `chip`/`chipAtivo`/`chipSelecionado` quase idênticas, nunca extraídas.
4. **Formulário de item com `TextInput` cru + `borderWidth`/`borderRadius: 8`**: `gestor/TurmasScreen.tsx` e `gestor/TurmaDetalheScreen.tsx` usam `<TextInput style={styles.input}>` direto, sem usar `CampoTexto` (que já existe e é usado no fluxo de auth). Essas duas telas não reaproveitam o design system parcial que já existe.
5. **Botão "solicitar vínculo" com estado "Solicitado"**: `aluno/VincularAlunoScreen.tsx` e `professor/VincularProfessorScreen.tsx` reimplementam o mesmo par de estilos (`botaoSolicitar`/`botaoSolicitarDesabilitado`) em vez de compartilhar.
6. **Card/linha de item com borda + raio 8** (`item`, `itemSimples` em `TurmaDetalheScreen`, `SessaoDetalheScreen`, `HistoricoScreen`, `TurmasDisponiveisScreen`, `VincularAlunoScreen`): mesmo padrão visual repetido com nomes de estilo diferentes em pelo menos 6 arquivos — é exatamente o "kit de card de SaaS" que o `DESIGN_BRIEF.md` pede para evitar (linha 35), mas está presente nas telas de gestor que não foram tocadas na leva mais recente de trabalho visual.

Não há hoje nenhum componente de domínio do Passo 2 (`BarraProgresso`, `CartaoMissao`, `Medalha`, `IndicadorSequencia`, `LinhaClassificacao`, `SeloFaixa`, `CartaoAluno`, `IndicadorFrequencia`) — esperado, já que dependem de dados de Ciclo 2/3 hoje bloqueados em `firestore.rules`.

---

## 4. Navegação atual

React Navigation (`@react-navigation/native` + `@react-navigation/native-stack`), sem Expo Router e sem `bottom-tabs` (ver conflito #3).

- `App.tsx` monta `AuthProvider` → `RootNavigator`.
- `RootNavigator.tsx` é a única fonte de verdade da escolha de raiz: lê `usuarioAuth` e `usuario.perfil` de `useAuth()` (contexto `AuthContext.tsx`, que por sua vez escuta `onAuthStateChanged` do Firebase e busca o documento em `usuarios/{uid}`). Sem `usuarioAuth` → `AuthStack`; com perfil `aluno`/`professor`/`academia` → a stack correspondente; qualquer outro caso (perfil ausente/desconhecido) cai de volta em `AuthStack`.
- Não existe hoje a tela de bloqueio da RN05 (aluno sem vínculo ativo cair numa tela que só oferece vinculação) — um aluno sem vínculo hoje simplesmente vê `AlunoStack` com `Dashboard` mostrando "Nenhuma sessão agendada" e precisa achar sozinho o link de rodapé "Meus vínculos". O `SCRIPT.md` Passo 3 pede essa tela de bloqueio explicitamente — é trabalho novo, não é regressão de algo que existia.
- `ProfessorStack` e `AcademiaStack` reexportam as mesmas 3 telas de `screens/gestor/` via `GestorStackParamList` (`navigation/types.ts`), já compartilhado entre as duas — bom precedente para a raiz única "Visão do Gestor" que o Passo 3 pede.
- Cada `Stack.Navigator` de gestor/aluno usa o header nativo padrão (título por `options={{ title }}`), exceto `AuthStack`, que usa `headerShown: false` e implementa seu próprio botão "‹ Voltar" (`Botao variante="texto"`) em cada tela.

---

## 5. Contratos de dados (tipos consumidos pelas telas)

Todos centralizados em `src/types/index.ts` — não há tipo de domínio duplicado ou definido dentro de uma tela:

| Tipo | Campos-chave | Consumido por |
|---|---|---|
| `Usuario` (`Perfil = 'academia' \| 'professor' \| 'aluno'`) | `nome`, `email`, `perfil`, `autonomo?`, `modalidades?`, `faixaOuGrau?`, `graduacao?`, `nomeAcademia?`, `endereco?` | `AuthContext`, todas as telas de `auth/`, dashboards |
| `Vinculo` (`StatusVinculo`, `TipoVinculo`) | `solicitanteId`, `destinatarioId`, `perfilSolicitante`, `perfilDestinatario`, `status` | `VincularAlunoScreen`, `VincularProfessorScreen`, `SolicitacoesProfessorScreen`, `SolicitacoesAcademiaScreen`, `academia/DashboardScreen` |
| `Turma` (`NivelTurma`) | `nome`, `modalidade`, `nivel`, `responsavelId`, `responsavelPerfil`, `professorId?`, `ativa` | `TurmasScreen`, `TurmaDetalheScreen`, `TurmasDisponiveisScreen`, `professor/DashboardScreen`, `academia/DashboardScreen` |
| `Matricula` (`StatusMatricula`) | `turmaId`, `alunoId`, `status` | `TurmaDetalheScreen`, `TurmasDisponiveisScreen`, `professor/DashboardScreen` |
| `Sessao` (`StatusSessao`) | `turmaId`, `professorId`, `inicio`, `fim`, `janelaCheckInInicio`, `janelaCheckInFim`, `status`, `leitoresIds` | `TurmaDetalheScreen`, `SessaoDetalheScreen`, `aluno/AgendaScreen`, `aluno/DashboardScreen`, `professor/DashboardScreen` |
| `CheckIn` (`StatusCheckIn`) | `sessaoId`, `alunoId`, `dataHora`, `status`, `pontos` (sempre 0 hoje) | `HistoricoScreen`, `SessaoDetalheScreen`, `professor/DashboardScreen`, `aluno/AgendaScreen`/`DashboardScreen` |
| `Missao`, `MissaoProgresso` | — | **Nenhuma tela hoje** (Ciclo 2/3, coleções bloqueadas) |
| `Graduacao` | — | **Nenhuma tela hoje** (Ciclo 3, bloqueado) |
| `ConfiguracaoGamificacao` | — | **Nenhuma tela hoje** (Ciclo 3, bloqueado) |
| `ConsentimentoLGPD` | — | **Nenhuma tela hoje** (Ciclo 4) — mas `firestore.rules` já tem regra pronta para essa coleção |

`VinculosPrivado` existe em `types/index.ts` mas é documento privado do Firestore, nunca lido por client — só relevante para `firestore.rules`, não para UI.

Camada de serviços correspondente, um arquivo por coleção (`src/services/*.ts`), todos com funções `async` tipadas retornando os tipos acima — superfície estável o bastante para as telas do Ciclo 1 consumirem sem alteração. Confirmando a restrição do `SCRIPT.md`: **não há necessidade de tocar em nenhum service para o Ciclo 1**; os services de `missoes`, `graduacoes`, `configuracoesGamificacao`, `consentimentosLGPD` já existem prontos para Ciclo 2–4, mas ficam inacessíveis por `firestore.rules` até essas rodadas.

---

## 6. Dívidas visuais

- **Cor e tipografia hardcoded ainda não existem como problema disperso** — todas as 18 telas importam de `constants/colors.ts` e `constants/typography.ts` (`Colors.*`, `FontSize.*`), nenhum hex ou tamanho de fonte solto encontrado nas telas de `auth/` e nos dashboards mais recentes. **Exceção**: `gestor/TurmasScreen.tsx`, `gestor/TurmaDetalheScreen.tsx` e `gestor/SessaoDetalheScreen.tsx` usam `fontSize` numérico literal (`16`, `12`, `18`, `22`, `13`) em vez de `FontSize.*`, e não usam `FontFamily` nenhuma — telas de gestor mais antigas, não tocadas na leva de refatoração de `auth/`/dashboards.
- **Magic numbers de espaçamento**: `paddingHorizontal: 20`, `24`, `16`, gaps `8`/`12`/`16`/`24` repetidos literalmente em quase todo `StyleSheet.create` do projeto — não existe hoje nenhuma constante de espaçamento (`Spacing`/`tokens.ts`). É exatamente o vazio que o Passo 1 do `SCRIPT.md` preenche.
- **Estados de carregamento inconsistentes**: cada tela usa seu próprio `<ActivityIndicator>` centralizado (`styles.centro`) — nenhuma usa esqueleto (`Esqueleto`/shimmer, pedido no Passo 2). Algumas telas (`aluno/DashboardScreen`, `professor/DashboardScreen`) mostram o indicador só na seção de lista, mantendo cabeçalho visível; outras (`HistoricoScreen`, `TurmasDisponiveisScreen`, `academia/DashboardScreen`, todas as de `gestor/`) bloqueiam a tela inteira atrás do spinner. Inconsistente entre telas.
- **Estado de erro sem ação de repetir**: em toda tela, erro é só `<Text style={styles.erro}>{erro}</Text>` (ou `Alert.alert` em `VincularAlunoScreen`, `VincularProfessorScreen`, `SolicitacoesProfessorScreen`, `SolicitacoesAcademiaScreen`) — nenhuma tem botão "Tentar novamente". O `SCRIPT.md` exige erro com ação de repetir em toda tela — hoje zero telas atendem isso.
- **Estado vazio inconsistente**: em geral é só um `<Text style={styles.vazio}>` cinza — nunca ilustração, ação ou convite (o `SCRIPT.md` pede "tela vazia é convite à ação, não lamento"; hoje é sempre só lamento textual, ex.: "Nenhuma turma criada ainda.").
- **Mistura de padrão de erro inline vs. `Alert.alert`**: telas de `auth/` e dashboards usam erro inline (`setErro`/`<Text>`); as 4 telas de vínculo/solicitação usam `Alert.alert` nativo — quebra de padrão entre fluxos do mesmo ciclo.
- **Alvo de toque**: nenhum componente tocável declara `accessibilityRole`/`accessibilityLabel` hoje (nem `Botao`, nem os `TouchableOpacity` inline nas telas), e nenhum garante 44x44 explicitamente — dependem do padding do conteúdo. Ambos pedidos como critério de aceite do Passo 2.
- **Reimplementação de `TextInput` fora do design system**: como já citado na seção 3, `gestor/TurmasScreen.tsx` e `gestor/TurmaDetalheScreen.tsx` não usam `CampoTexto`, reimplementam estilo de input do zero.
- **`semAnelDeFoco` duplicado em 4 arquivos** (`Botao.tsx`, `SelecaoPerfilScreen.tsx`, `CadastroProfessorScreen.tsx`, `ModalitySelector.tsx`) como a mesma constante local `{ outlineWidth: 0 } as const` — não centralizada.

---

## 7. Itens de limpeza conhecidos

- **Botão de teste temporário em `DashboardScreen.tsx`**: não encontrado (ver conflito #2). Nada a remover hoje; se surgir em outro branch/stash, sinalizar antes de excluir.
- `IconeSino` e `IconeCirculo` (`components/icones/index.tsx`) declarados e nunca importados por nenhuma tela — candidatos a uso futuro (sino = notificações RF31, Ciclo 4) ou remoção, a decidir com você.
- Duplicações da seção 3 (item 1, 2, 3, 5, 6) são o principal trabalho de consolidação esperado no Passo 2 — não é "código morto", é lógica repetida que deveria virar componente único.
- `gestor/TurmasScreen.tsx`, `TurmaDetalheScreen.tsx`, `SessaoDetalheScreen.tsx` são visivelmente de uma leva de desenvolvimento anterior à padronização de `Colors`/`FontSize` usada em `auth/` e nos dashboards (fontSize literal, sem `CampoTexto`, sem ícones do vocabulário de luta) — maior superfície de refatoração do Ciclo 1.
- `script.md` (raiz, minúsculo) está com alterações não commitadas (`git status`: `M script.md`, 109 inserções / 44 remoções em relação ao último commit) — é o próprio arquivo que você colou como `SCRIPT.md` neste prompt; mencionando para registro, não é ação a tomar.

---

## Pendências para sua decisão antes do Passo 1

1. **Qual documento de direção visual prevalece** — `DESIGN_BRIEF.md` (já implementado em `colors.ts`/`typography.ts`/ícones) ou `SCRIPT.md` (paleta com `brass`, tipografia Homebase+Inter, regra de cartão única)? Ou uma fusão — e se sim, qual critério para cada ponto de conflito da seção 0.
2. Sem asset de Homebase no repositório, como proceder: buscar o arquivo de fonte, usar um fallback definitivo, ou manter Oswald como já está?
3. Confirmar que a adição de `@react-navigation/bottom-tabs` (não listada nas dependências já liberadas do `SCRIPT.md`: `expo-font`, `expo-haptics`, `react-native-svg`) está aprovada para o Passo 3.
