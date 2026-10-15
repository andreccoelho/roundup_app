# Relatório de UI/UX: RoundUp

Diagnóstico somente leitura. Branch `feat/ui-design-system` (HEAD `c784b48`), 15/10/2026. Nenhum arquivo do repositório foi alterado além deste.
Convenção: `arquivo:linha` é relativo à raiz do repo. **[SUPOSIÇÃO]** marca o que não foi verificado em execução ou que depende de inferência.

---

## 0. Como foi feita a análise

- **Código:** li todos os arquivos de `src/components/`, `src/screens/`, `src/navigation/` e `src/theme/`, além de `App.tsx`, `app.json`, `DESIGN_BRIEF.md`, `script.md`, `docs/REDESIGN_LOG.md`, `docs/AUDITORIA_UI.md` e `docs/DECISOES_PENDENTES.md`.
- **Render real:** subi `expo start --web` (porta 8090) e naveguei com Playwright (`playwright-core` instalado no diretório temporário, fora do repo; Chrome do sistema) em 375×812, 768×1024 e 1440×900. Todas as requisições a `firestore.googleapis`, `identitytoolkit`, `securetoken` e `firebasestorage` foram **bloqueadas** no navegador, então nada foi lido nem escrito no Firebase.
- **O que foi visto renderizado:** Login (vazio, com erros e foco por Tab), Seleção de perfil, Consentimento LGPD, Cadastro do Aluno (vazio e com erros), Recuperar senha e a **Galeria de componentes** (`src/screens/dev/GaleriaScreen.tsx`, só em `__DEV__`). A Galeria renderiza todos os componentes de `src/components/ui/` com dados fictícios, incluindo Diálogo, Folha e CelebracaoGraduacao abertos.
- **O que NÃO foi visto renderizado:** todas as telas autenticadas (dashboards, abas, perfis, gestor). `src/services/firebase.ts:14-35` aponta para o projeto Firebase **real** via `.env` e não há emulador de Auth/Firestore configurado no client. Para entrar seria preciso logar ou criar conta em produção, o que gera efeito colateral. Essas telas foram avaliadas **só pelo código**. Elas são compostas dos mesmos componentes que vi na Galeria, então a avaliação visual delas é uma inferência razoável.
- **Nativo (iOS/Android):** não foi executado (não há emulador nesta máquina). Pontos que dependem de notch, safe area ou teclado nativo estão marcados como [SUPOSIÇÃO].
- Os screenshots ficaram em `%TEMP%\claude\...\scratchpad\pw\shots\` (fora do repo, não versionados).

---

## 1. Resumo

**Produto:** RoundUp é um app mobile (Expo/React Native, com web via react-native-web) de gamificação para academias de luta (Boxe/Muay Thai, e o seletor também oferece Jiu-Jitsu, MMA, Karatê, Taekwondo, Judô e Kickboxing; ver `src/constants/modalidades.ts`). Tem três perfis: **Aluno** (check-in, agenda, XP/nível, sequência, missões, ranking, medalhas, faixa), **Professor** (turmas, sessões, chamada, missões, graduação) e **Academia** (o mesmo do professor, mais gestão de professores/alunos e visão consolidada). O público é o aluno de luta, de adolescente a adulto, e o professor/gestor da academia.

**Temática pretendida:** "de lutador para lutador", com tom de ringue, cartaz de luta, placar e ficha de pesagem (`DESIGN_BRIEF.md:11-15`).

**Impressão geral:** a base técnica está organizada (tokens centralizados, componentes de domínio, ícones SVG temáticos próprios). Mas o visual renderizado ainda é um **app utilitário claro e genérico**: fundo branco, texto de sistema, formulários sublinhados e muito espaço vazio. A identidade de luta aparece só no logo, em detalhes de baixa opacidade (textura de lona a 5–8%, marca d'água a 12%) e em títulos Homebase que hoje estão **ilegíveis** por causa da sombra dura preta sobre texto preto. A ação mais importante do app, o check-in, é um botão de 12px. No desktop/tablet o layout estica sem limite de largura. O app nativo ainda usa **ícone e splash padrão do Expo**.

---

## 2. Stack de front-end

| Item | Valor | Fonte |
|---|---|---|
| Framework | Expo SDK `~57.0.21`, React Native `0.86.3`, React `19.2.3`, TypeScript `~6.0.3` | `package.json` |
| Web | `react-native-web ^0.21.2`, `react-dom 19.2.3` | `package.json` |
| Navegação | React Navigation 7: `@react-navigation/native ^7.3.18`, `native-stack ^7.18.10`, `bottom-tabs ^7.19.1`. Sem Expo Router. | `package.json`, `src/navigation/*` |
| Estilo | `StyleSheet.create` puro, sem Tailwind/NativeWind, styled-components ou lib de componentes. Tokens próprios em `src/theme/tokens.ts`. | — |
| Componentes | Biblioteca própria em `src/components/ui/` (25 arquivos) | — |
| Ícones | 13 ícones SVG próprios (line-art) em `src/components/icones/index.tsx`, via `react-native-svg 15.15.4`. Nenhuma lib de ícones. | — |
| Fontes | Oswald 400/600/700 (`@expo-google-fonts/oswald ^0.4.2`) e Homebase (`assets/fonts/homebase.ttf`, 20 KB, datado de 2020), carregadas em `App.tsx:15-22`. Corpo usa a fonte do sistema. | `App.tsx` |
| Animação | `Animated` nativo do RN. **Sem** `react-native-reanimated`, `moti`, `lottie` ou `expo-haptics`. | `package.json`, `docs/REDESIGN_LOG.md:38` |
| Gradiente/blur | Nenhuma lib (`expo-linear-gradient`/`expo-blur` ausentes). O "relevo" da Medalha é simulado com Views (`src/components/ui/Medalha.tsx:4-8`). | — |
| Safe area | `react-native-safe-area-context ~5.7.0` instalado, mas **nunca importado** em `src/` (grep `SafeArea\|useSafeAreaInsets` = 0 resultados) | — |
| Tema | Só claro: `app.json:7` `"userInterfaceStyle": "light"`. Sem dark mode. | `app.json` |
| Orientação | `portrait` (`app.json:6`), com `ios.supportsTablet: true` (`app.json:9`) | `app.json` |

**Onde fica cada coisa:**
- Tokens: `src/theme/tokens.ts` (fonte única), reexportados por `src/theme/index.ts` e pelas camadas legadas `src/constants/colors.ts` (`Colors`) e `src/constants/typography.ts` (`FontFamily`, `FontSize`).
- Estilo da casca de navegação (header e tab bar): `src/navigation/opcoesCasca.ts`.
- Assets: `assets/` (logos `roundup_logo.png` e `roundup_logo_invertida.png` em 1200×1200, ícones de app, splash, favicon) e `assets/fonts/homebase.ttf`.
- Documentos de direção visual (já existentes e parcialmente conflitantes): `DESIGN_BRIEF.md`, `script.md`, `CHANGELOG_UI.md`, `docs/REDESIGN_LOG.md`, `docs/AUDITORIA_UI.md` (desatualizado: descreve um estado anterior às abas e aos componentes atuais).

---

## 3. Inventário de telas

Navegação: `src/navigation/RootNavigator.tsx:16-27` escolhe a raiz pelo perfil: `AuthStack`, `AlunoRaiz` (bloqueio RN05 ou `AlunoTabs`), `ProfessorTabs` ou `AcademiaTabs`.

### Auth / onboarding (`AuthStack`, `headerShown: false`)

| Tela | Rota / arquivo | Propósito | Componentes principais |
|---|---|---|---|
| Login | `Login` / `src/screens/auth/LoginScreen.tsx` | RF02, entrar | `Image` (logo), `CampoTexto`, `Botao` (primário e texto) |
| Recuperar senha | `RecuperarSenha` / `auth/RecuperarSenhaScreen.tsx` | RF02 | `CampoTexto`, `Botao` |
| Seleção de perfil | `SelecaoPerfil` / `auth/SelecaoPerfilScreen.tsx` | RF01 | `LinhaFina`, ícones `IconePoste`/`IconeLuva`/`IconeFaixa`, `TouchableOpacity` |
| Consentimento LGPD | `ConsentimentoLGPD` / `auth/ConsentimentoLGPDScreen.tsx` | RF28 | checkbox custom, `Botao` |
| Cadastro Aluno | `CadastroAluno` / `auth/CadastroAlunoScreen.tsx` | RF01/RF06 | `CampoTexto`×6-8, `ModalitySelector`, `Botao` |
| Cadastro Professor | `CadastroProfessor` / `auth/CadastroProfessorScreen.tsx` | RF01/RF05 | `CampoTexto`, `ModalitySelector`, toggle segmentado inline (`:151-178`) |
| Cadastro Academia | `CadastroAcademia` / `auth/CadastroAcademiaScreen.tsx` | RF01/RF04 | `CampoTexto`, `ModalitySelector` |
| Galeria (dev) | `Galeria` / `src/screens/dev/GaleriaScreen.tsx` | Vitrine de componentes, só em `__DEV__` (`AuthStack.tsx:43`) | todos |

### Aluno (`AlunoRaiz` → `AlunoTabs`: Treinar, Agenda, Missões, Classificação, Perfil)

| Tela | Rota / arquivo | Propósito | Componentes principais |
|---|---|---|---|
| Bloqueio de vínculo | `Bloqueio` / `aluno/BloqueioVinculoScreen.tsx` | RN05, sem vínculo ativo | `EstadoVazio`, `Botao` texto |
| Home do Aluno | Treinar › `Dashboard` / `aluno/DashboardScreen.tsx` | RF14, check-in inline, RF17/RF21 | banda preta, `TexturaLona`, `Avatar`, `SeloFaixa`, `Etiqueta`, `BarraProgresso`, `IndicadorSequencia`, `CartaoSessao`→`BotaoCheckIn`, `LinhaFina` |
| Turmas disponíveis | Treinar › `TurmasDisponiveis` / `aluno/TurmasDisponiveisScreen.tsx` | RF11, matrícula | `Cartao`, `Botao`, `Esqueleto`, `EstadoVazio/Erro` |
| Histórico | Treinar › `Historico` / `aluno/HistoricoScreen.tsx` | RF15 | `Cartao` (pilha), `Esqueleto` |
| Agenda | `Agenda` / `aluno/AgendaScreen.tsx` | RF13/RF14 | `CartaoSessao`, `LinhaFina`, `ActivityIndicator` |
| Missões | `Missoes` / `aluno/MissoesScreen.tsx` | RF18 | `CartaoMissao` (pilha), `Esqueleto` |
| Classificação | `Classificacao` / `aluno/ClassificacaoScreen.tsx` | RF20 | `Podio`, `LinhaClassificacao`, `LinhaFina` |
| Perfil | Perfil › `Perfil` / `aluno/PerfilScreen.tsx` | RF06, RF17/19/21 | banda preta, `Avatar`, `SeloFaixa`, stats, `Medalha`, `Botao` compacto ×3, `ExcluirContaSecao` |
| Editar perfil | `EditarPerfil` / `compartilhado/EditarPerfilScreen.tsx` | RF04-06 | `Avatar`, `CampoTexto`, `ModalitySelector`, `Aviso` |
| Meus vínculos | `VincularAluno` / `aluno/VincularAlunoScreen.tsx` | RF08 | `Cartao`, `Botao` |
| Preferências de notificação | `PreferenciasNotificacao` / `compartilhado/PreferenciasNotificacaoScreen.tsx` | RF31 | `Etiqueta` usada como toggle |

### Professor e Academia (`ProfessorTabs`/`AcademiaTabs`: Hoje, Turmas, Alunos, Missões, Perfil)

| Tela | Rota / arquivo | Propósito | Componentes principais |
|---|---|---|---|
| Hoje (Professor) | `Dashboard` / `professor/DashboardScreen.tsx` | RF10/RF12, chamada | banda preta, `Etiqueta` (seletor de turma), contadores, botão de presença inline |
| Hoje (Academia) | `Dashboard` / `academia/DashboardScreen.tsx` | RF09 | banda preta, 3 contadores, lista de professores |
| Turmas | `Turmas` / `gestor/TurmasScreen.tsx` | RF10, criar e listar | formulário longo + `Cartao` (pilha) |
| Turma (detalhe) | `TurmaDetalhe` / `gestor/TurmaDetalheScreen.tsx` | RF10/RF11/RF12 | 3 seções (matriculados, nova sessão, sessões), `Cartao` |
| Sessão (detalhe) | `SessaoDetalhe` / `gestor/SessaoDetalheScreen.tsx` | abrir/encerrar, check-ins | `Botao` secundário ×2, `Cartao` |
| Relatório de frequência | `RelatorioFrequencia` / `gestor/RelatorioFrequenciaScreen.tsx` | RF26 | `TextInput` cru ×2, `LinhaFina` |
| Alunos | `Alunos` / `gestor/AlunosScreen.tsx` | RF24 | `CartaoAluno`, `IndicadorFrequencia` |
| Registrar graduação | `RegistrarGraduacao` / `gestor/RegistrarGraduacaoScreen.tsx` | RF25 | `TextInput` cru ×3, `Dialogo`, `CelebracaoGraduacao` |
| Missões (gestor) | `Missoes` / `gestor/MissoesGestorScreen.tsx` | RF23 | `Folha` com formulário, `Etiqueta` como toggle |
| Solicitações / Gestão de professores / de alunos | `Solicitacoes*` / `gestor/SolicitacoesScreen.tsx` | RF07/RF09 | `Botao` ×2 por linha, `Dialogo` destrutivo |
| Vincular a academia (Prof.) | `VincularProfessor` / `professor/VincularProfessorScreen.tsx` | RF07 | `Cartao`, `Botao` |
| Visão consolidada (Acad.) | `VisaoConsolidada` / `academia/VisaoConsolidadaScreen.tsx` | RF27 | contadores, % |
| Perfil (Prof./Acad.) | `professor/PerfilScreen.tsx`, `academia/PerfilScreen.tsx` | RF04/RF05 | banda preta, `Botao` compacto ×4-5, `ExcluirContaSecao` |
| Tela "em breve" | `compartilhado/TelaEmBreve.tsx` | placeholder | `EstadoVazio` (hoje sem uso nas rotas) |

### Componentes reutilizáveis (`src/components/`)

Base: `Botao`, `CampoTexto`, `Cartao`, `Etiqueta`, `Abas`, `Avatar`, `Dialogo`, `Folha`, `Aviso`, `Esqueleto`, `EstadoVazio`, `EstadoErro`, `ModalitySelector`, `LinhaFina`, `LoadingScreen`, `TexturaLona`.
Domínio: `BotaoCheckIn`, `CartaoSessao`, `BarraProgresso`, `IndicadorSequencia`, `IndicadorFrequencia`, `CartaoMissao`, `CartaoAluno`, `LinhaClassificacao`, `Podio`, `Medalha`, `SeloFaixa`, `CelebracaoGraduacao`.
Ícones: `IconeLuva`, `IconeSino`, `IconeCadeado`, `IconeCheck`, `IconeCorda`, `IconeCirculo`, `IconeFaixa`, `IconePoste`, `IconeFichaTecnica`, `IconeBandeira`, `IconeCartaoPontuacao`, `IconePerfil`, `IconeTatame`. `IconeCorda` e `IconeCirculo` não são usados em nenhuma tela.

**Componentes que faltam e cuja ausência gera duplicação:** banda de identidade (copiada em 6 telas), cabeçalho de seção, linha de lista com ação, contador/estatística, campo de data/hora, toggle/switch, checkbox, item de menu/configuração.

---

## 4. Design system atual (extraído do código)

### 4.1 Paleta (`src/theme/tokens.ts:6-29`)

| Token | Hex | Uso real |
|---|---|---|
| `preto` | `#0A0A0A` | texto principal, botão primário, bandas de topo, chip ativo |
| `branco` | `#FFFFFF` | fundo de **todas** as telas, header, tab bar, cards |
| `cinzaEscuro` | `#2A2A2A` | borda do botão secundário e do chip, fundo do avatar sem foto, texto de chip |
| `cinzaMedio` | `#6B6B6B` | texto secundário (o mais usado) |
| `cinzaClaro` | `#757575` | placeholder, texto terciário, texto sobre banda preta |
| `cinzaBorda` | `#D9D9D9` | separadores, borda de card, sublinhado de input, esqueleto |
| `cinzaFundo` | `#F4F4F4` | trilha de barra, linha destacada, faixa de stats. O comentário em `:19` diz "fundo de tela", mas **nenhuma tela usa como fundo**: todas usam `branco`. |
| `checkinValidado` | `#2E7D32` | check-in feito, "Presente", status validado |
| `alerta` | `#B3261E` | erros, janela fechada, botão destrutivo |
| `impacto` | `#1B9E3E` | flash de 80ms no check-in (`BotaoCheckIn.tsx:116`) |

**Cores fora do tema:**
- `'#0A0A0A'` hardcoded como default em todos os 13 ícones (`src/components/icones/index.tsx:11,30,45,65,79,98,107,128,144,167,182,200,210`), em vez de `Cores.preto`.
- Overlays `rgba(10,10,10,0.7)` em `CelebracaoGraduacao.tsx:54` e `rgba(10,10,10,0.5)` em `Dialogo.tsx:48` e `Folha.tsx:22`. Não existe token de overlay e há dois valores diferentes.
- `app.json:15` usa `adaptiveIcon.backgroundColor: "#E6F4FE"` (azul-claro, padrão do template Expo), fora da paleta.

**Inconsistências de paleta:**
- `cinzaMedio #6B6B6B` e `cinzaClaro #757575` são quase iguais (5,33:1 vs 4,61:1 sobre branco). O próprio token admite que a hierarquia colapsou (`tokens.ts:11-16`). Na prática há **2 níveis de texto**, não 3.
- `checkinValidado #2E7D32` e `impacto #1B9E3E` são dois verdes para o mesmo significado.
- `alerta` cumpre dupla função: erro de formulário e "janela de check-in fechada", que não é erro e sim estado.
- Não existem tokens de superfície/elevação (`sup1`, `sup2`), de overlay, de foco nem de texto sobre fundo escuro. Por isso as telas improvisam com `cinzaClaro` sobre preto, que reprova contraste (ver §8).

### 4.2 Tipografia

**Famílias (`tokens.ts:32-42`):**
- `Oswald_400Regular` / `600SemiBold` / `700Bold` (placar)
- `Homebase` (display, só caixa alta, glifos acentuados confirmados na Galeria)
- `regular: undefined` (sistema: Segoe UI no web/Windows, San Francisco no iOS, Roboto no Android)

**Escala (`tokens.ts:44-53`) e uso real** (contagem por grep em `src/`):

| Token | px | Usos | Observação |
|---|---|---|---|
| `xs` | 12 | 33 (+2 `FontSize.xs`) | inclui o **CTA de check-in** (`BotaoCheckIn.tsx:102`) e os rótulos da tab bar |
| `sm` | 14 | 82 (+3) | tamanho dominante do app |
| `md` | 16 | 41 (+2) | corpo, títulos de seção |
| `lg` | 20 | 7 | títulos de seção nas telas de gestor, título do header |
| `xl` | 24 | 3 | |
| `xxl` | 32 | 21 | títulos Homebase, contadores dos gestores |
| `placar` | 48 | **1** (`IndicadorSequencia.tsx:21`) | |
| `placarLg` | 64 | **0** | token morto |

**Pesos:** `fontWeight '600'` aparece 36×, `'700'` 23×. Não há `'800'/'900'`. Oswald 700 só aparece em `IndicadorSequencia`.

**Uso de famílias:** `homebaseDisplay` 15×, `placarSemiBold` 7×, `placarBold` 1×, `placarRegular` 1×.

**Hierarquia real e inconsistências:**
1. Há **quatro tratamentos diferentes de "título de tela"**:
   - (a) Homebase 32 com sombra dura: auth (`SelecaoPerfilScreen.tsx:87-93`, `RecuperarSenhaScreen.tsx:92-98`, `ConsentimentoLGPDScreen.tsx:77-83`, `CadastroAlunoScreen.tsx:231-237` e equivalentes);
   - (b) Oswald SemiBold 20 no header nativo (`opcoesCasca.ts:17-21`), cujo comentário em `:6-8` diz que Homebase "ainda não foi aprovada";
   - (c) sistema 700 32 (`TurmaDetalheScreen.tsx:252`, `SessaoDetalheScreen.tsx:152`);
   - (d) sistema 700 24 (`RegistrarGraduacaoScreen.tsx:117`), que duplica o título do header (`GestorTabsCompartilhado.tsx:45`).
2. **Números de placar fora do Oswald**, contrariando `DESIGN_BRIEF.md:22` e `script.md:40`: contadores dos gestores usam sistema 700 32 (`professor/DashboardScreen.tsx:304`, `academia/DashboardScreen.tsx:191`, `academia/VisaoConsolidadaScreen.tsx:106,111`). Já XP, nível e posições usam Oswald. São dois idiomas numéricos.
3. Título de seção varia entre `md/600` (`aluno/DashboardScreen.tsx:257`, `SolicitacoesScreen.tsx:247`), `lg/700` (`TurmasScreen.tsx:248`, `VincularAlunoScreen.tsx:129`) e `lg/700` com margem diferente (`TurmaDetalheScreen.tsx:256`).
4. Sem `lineHeight` definido, exceto `lineHeight: 20` literal em 2 lugares (`SelecaoPerfilScreen.tsx:110`, `ConsentimentoLGPDScreen.tsx:92`).
5. Sem `letterSpacing` padronizado: `1` em 6 bandas, `0.3` no Botao (`Botao.tsx:95`).
6. Não existe escala de texto semântica (`titulo1`, `corpo`, `legenda`, `numeroPlacar`). Cada `StyleSheet` recompõe `fontSize + fontWeight + color`.

### 4.3 Espaçamento, raios, sombras, breakpoints

**Espaçamento (`tokens.ts:58-66`):** 4/8/12/16/24/32/48, bem adotado. Exceções:
- Literais: `CampoTexto.tsx:32-45` (`20`, `6`, `8`, `4`), `ModalitySelector.tsx:75-96` (`20`, `10`, `8`, `14`, `12`, `6`), `AgendaScreen.tsx:115-118` (`20`, `8`, `12`, `16`), `marginTop: 2` em 7 arquivos.
- Valores compostos fora da grade: `Espacamento.grande + Espacamento.minimo` = 28 (`SelecaoPerfilScreen.tsx:98,104`, dashboards `rodape`) e `Espacamento.minimo / 2` = 2 (`CadastroAlunoScreen.tsx:241`).
- **Margem lateral da tela sem padrão:** 24 em auth e dashboards; 16 em listas, perfis (corpo), formulários de gestor e Classificação; 20 em `AgendaScreen.tsx:115`. **Dentro da mesma tela de Perfil** a banda usa 24 (`aluno/PerfilScreen.tsx:162`) e o corpo 16 (`:192,195,201,204`), então as bordas esquerdas ficam desalinhadas.

**Raios (`tokens.ts:69-75`):** 0/4/8/16/20.
- `Botao` = 4 (`Botao.tsx:88`)
- `BotaoCheckIn`, `Cartao`, `Aviso`, `Dialogo`, `Podio`, política LGPD = 8
- `Etiqueta`, botão de presença, `Folha` = 16
- `Abas`, `SeloFaixa`, toggle do cadastro = 20; `ModalitySelector.tsx:81` = 20 literal

Ou seja, **dois chips quase idênticos com raios 16 e 20** (`Etiqueta` vs `ModalitySelector`), e o botão primário (4) tem raio diferente do botão de check-in (8), que é a ação primária mais importante.

**Sombras:** apenas `Sombras.duraTitulo` (text-shadow 3/3/0, `tokens.ts:91-97`). Não há elevação em nenhuma superfície, o que está alinhado ao brief, que proíbe sombra suave genérica. O efeito colateral é que Diálogo e Folha não se destacam por profundidade, só pelo overlay.

**Breakpoints:** nenhum. Sem `useWindowDimensions`/`Dimensions`, sem `maxWidth` de container (os únicos `maxWidth` são internos: `Dialogo.tsx:49` 360, `CelebracaoGraduacao.tsx:60` 360, `Podio.tsx:62`, `BotaoCheckIn.tsx:118`).

**Durações (`tokens.ts:80-85`):** 150/200/320/500. Mais os literais `80` (`BotaoCheckIn.tsx:36`) e `600` (`Esqueleto.tsx:29-30`).

### 4.4 Componentes base e variações

| Componente | Variações | Observações (render + código) |
|---|---|---|
| `Botao` (`ui/Botao.tsx`) | `primario` (preto), `secundario` (contorno `#2A2A2A`), `fantasma`, `destrutivo` (`#B3261E`), `texto` (link sublinhado cinza); `compacto`; `carregando`; `desabilitado` (opacity 0.4) | Raio 4, peso 600, 16px. Sem variante "hero/CTA" nem ícone. O `texto` é centralizado por padrão (`:96`), por isso "‹ Voltar" fica **centralizado no topo** das telas de auth (visto no render). O estado desabilitado só reduz a opacidade (fica cinza-médio sobre branco). |
| `BotaoCheckIn` (`ui/BotaoCheckIn.tsx`) | `disponivel` (botão preto + luva), `foraDaJanela` (cadeado + texto vermelho), `realizado` (check verde + "Feito", com punch scale 1.25 + flash) | Texto do CTA em **12px** (`:102`). O estado "fora da janela" quebra em 2 linhas (`maxWidth: 120`, `:118`). |
| `CartaoSessao` | 3 estados | Ícone de estado **duplicado**: leading (`:41`) e de novo dentro do `BotaoCheckIn` (`:61,:52`). No render, a linha "fora da janela" mostra dois cadeados. |
| `CampoTexto` (`ui/CampoTexto.tsx`) | normal, erro | Sublinhado `#D9D9D9` 1px, sem estado de foco, label sem vínculo de acessibilidade. Placeholder `#757575` quase com a cor do texto real: no render, "seuemail@exemplo.com" e "••••••••" parecem valores já preenchidos. |
| `TextInput` cru | — | Reimplementa o `CampoTexto` em `RegistrarGraduacaoScreen.tsx:76-82,121`, `RelatorioFrequenciaScreen.tsx:60-63,97`, `MissoesGestorScreen.tsx:166-182,204`, `ModalitySelector.tsx:61-67,88`. Sem `outlineWidth: 0`, então no web esses campos exibem o anel azul do navegador e o `CampoTexto` não exibe nada. |
| `Cartao` (`ui/Cartao.tsx`) | padrão (borda `#D9D9D9`, raio 8), `semBorda`, `raio`, `corteDiagonal` (SVG), `corFundo` | O corte diagonal (14% do lado) mal aparece no render da Galeria. **Nenhuma tela usa `corteDiagonal`** (grep). O padrão com borda é exatamente o "kit de card de SaaS" que o brief proíbe e continua em `HistoricoScreen.tsx:90`, `TurmasDisponiveisScreen.tsx:95`, `VincularAlunoScreen.tsx:63`, `VincularProfessorScreen.tsx:80`, `TurmasScreen.tsx:232`, `TurmaDetalheScreen.tsx:200,238`, `SessaoDetalheScreen.tsx:137` e `CartaoMissao.tsx:19`. |
| `Etiqueta` (`ui/Etiqueta.tsx`) | estática, selecionável, desabilitada | Usada como chip, filtro, **toggle on/off** (`PreferenciasNotificacaoScreen.tsx:69`, `MissoesGestorScreen.tsx:148`) e **rótulo estático** de modalidade nas bandas. São 4 semânticas no mesmo visual. |
| `ModalitySelector` | pílulas multi-select + "Outra" | Duplica `Etiqueta` com raio e padding diferentes (`:78-84`). Sem `accessibilityRole`/`State` (`:44-58`). |
| `Abas` (`ui/Abas.tsx`) | segmentado | **Nenhuma tela usa** (só a Galeria). `CadastroProfessorScreen.tsx:151-178` reimplementa o mesmo controle à mão. |
| `Dialogo` | padrão, destrutivo | Caixa branca raio 8, título 20/700 (sistema), ações à direita. Genérico. |
| `Folha` | — | Sem "alça", sem botão de fechar, sem `KeyboardAvoidingView`/`ScrollView` interno (`Folha.tsx:14-17`). |
| `Aviso` (toast) | padrão (preto), erro (vermelho) | Sem variante de sucesso. Posição `bottom: 24` absoluta **dentro do ScrollView** (`ExcluirContaSecao.tsx:62`, `EditarPerfilScreen.tsx:171`): no conteúdo rolado, aparece no fim do conteúdo e não na viewport [SUPOSIÇÃO: não verificado em tela autenticada]. |
| `Esqueleto` | altura/largura/repetições | Respeita reduce motion. Blocos genéricos que não espelham o layout real. |
| `EstadoVazio` / `EstadoErro` | com/sem ação | Só texto + botão secundário, sem ícone ou ilustração. Erro em vermelho 16px centralizado. |
| `SeloFaixa` | claro (pílula preta), `sobreEscuro` (contorno branco) | Faixa como texto livre ("Faixa roxa, 2º grau"). **A cor da faixa não aparece em lugar nenhum.** |
| `BarraProgresso` | 10 segmentos | Segmento vazio `#F4F4F4` sobre branco, 1,10:1, quase invisível. |
| `Medalha` | conquistada, bloqueada | 3 círculos cinza. No render parece um botão de rádio ou rolamento, não um emblema. |
| `Podio` | 1º/2º/3º | Só o avatar muda de tamanho (64 vs 44). Sem degraus nem altura de pódio. A linha de base é a mesma para os três (render). |
| `CelebracaoGraduacao` | — | Modal branco de 360px com a Medalha cinza pequena, "Novo grau!" em Homebase 32 e o botão "Fechar". Pouco "momento" para o evento mais importante da jornada. |
| `TexturaLona` | opacidade, cor | Trama diagonal SVG, `id="lona"` fixo (`TexturaLona.tsx:24`). Duas instâncias na mesma árvore podem colidir de `id` no web [SUPOSIÇÃO]. Gera warning de prop desconhecida no DOM (console do web: "React does not recognize the `%s` prop", 2× por carga). |

### 4.5 Ícones, imagens, ilustrações

- **Ícones:** 13 SVG line-art próprios, traço 1.4–2.0, viewBox 24, todos coerentes entre si. São o ponto mais forte de identidade do app. Usados na tab bar (`AlunoTabs.tsx:121-141`, `ProfessorTabs.tsx:81-101`), na seleção de perfil e no check-in. No render a 24px, `IconeFaixa` lê como "mesa/portal" e `IconePoste` como "antena" (`mobile-05-selecao-perfil`).
- **Logo:** `assets/roundup_logo.png` (preto sobre transparente) e `roundup_logo_invertida.png` (branco), ambos 1200×1200. Ringue com 4 postes + lettering "RNDP". No Login é exibido em 180×180 (`LoginScreen.tsx:133`). Como marca d'água nas bandas, aparece em 220×220 ou 180×180 com opacidade 0.12.
- **Ícone de app / splash / adaptive icon: são os do template Expo.** `assets/icon.png` é o "A" azul do Expo sobre grade azul. `assets/android-icon-foreground.png` é o mesmo "A" azul. `assets/splash-icon.png` é uma grade cinza com círculos (placeholder). `app.json:15` usa fundo `#E6F4FE`. Não há configuração de splash (`app.json:19-22` lista o plugin sem opções).
- **Imagens/ilustrações:** nenhuma. Estados vazios, erros, onboarding e celebração são só texto.
- **Fotos de usuário:** `Avatar` com `Image` circular ou iniciais brancas sobre `#2A2A2A`.

---

## 5. Problemas de UI

Severidade: **Crítica** = quebra legibilidade/identidade de forma visível a todos; **Alta** = degrada muito a percepção de qualidade; **Média** = inconsistência perceptível; **Baixa** = acabamento.

| ID | Tela/componente | Local | Problema | Severidade |
|---|---|---|---|---|
| UI-01 | Títulos Homebase (auth) | `SelecaoPerfilScreen.tsx:87-93`, `RecuperarSenhaScreen.tsx:92-98`, `ConsentimentoLGPDScreen.tsx:77-83`, `CadastroAlunoScreen.tsx:231-237` (+ Professor/Academia), token em `tokens.ts:91-97` | `Sombras.duraTitulo` aplica sombra **preta** deslocada 3/3 sobre texto **preto** em Homebase (fonte bold e condensada, contra-formas pequenas). **Render: título ilegível**, vira um borrão ("Como você vai usar o RoundUp?", "Privacidade dos seus dados", "Cadastro"). Confirmado com computed style `text-shadow: rgb(10,10,10) 3px 3px 0px`. Na Galeria (`GaleriaScreen.tsx:78`), sem sombra, a mesma fonte é legível. | Crítica |
| UI-02 | Ícone/splash do app | `assets/icon.png`, `assets/android-icon-foreground.png`, `assets/splash-icon.png`, `app.json:15` | Ícone e splash são os placeholders do template Expo (A azul, grade). Primeira impressão do produto na loja e na home do celular sem nenhuma marca. | Crítica |
| UI-03 | Check-in (CTA principal) | `BotaoCheckIn.tsx:89-102`, `CartaoSessao.tsx:40-47` | A ação mais repetida do produto (RNF01) é um botão de **12px** alinhado à direita numa linha de lista, do mesmo tamanho visual dos selos de estado. Não existe hero de "próximo treino / fazer check-in" na Home. | Alta |
| UI-04 | Layout geral | todas as telas | Fundo `#FFFFFF` em 100% das telas, texto de sistema e formulários sublinhados: lê como app utilitário/produtividade. A temática de luta fica restrita a detalhes com opacidade de 5–12% (`TexturaLona` 0.05–0.08, marca d'água 0.12). | Alta |
| UI-05 | Login | `LoginScreen.tsx:55-64,127-135` | Logo 180px, tagline cinza 14px e formulário genérico. Sem nenhum elemento de impacto (cor, foto, tipografia display). Metade inferior vazia em 375×812. | Alta |
| UI-06 | Bandas de identidade | `aluno/DashboardScreen.tsx:119-139,210-241`, `professor/DashboardScreen.tsx:136-154,259-281`, `academia/DashboardScreen.tsx:84-96,156-178`, `aluno/PerfilScreen.tsx:71-86,157-175`, `professor/PerfilScreen.tsx:26-46,88-107`, `academia/PerfilScreen.tsx:25-42,90-108` | Mesmo bloco copiado 6×, com variações acidentais: marca d'água `-40/-70/220` vs `-30/-60/180`; `TexturaLona` presente em 4 de 6; sombra no nome presente em 4 de 6 (ausente em `professor/DashboardScreen.tsx:275-281` e `academia/DashboardScreen.tsx:172-178`). | Média |
| UI-07 | Perfis | `aluno/PerfilScreen.tsx:117-126`, `professor/PerfilScreen.tsx:58-73`, `academia/PerfilScreen.tsx:54-75` | Navegação de configurações feita com 3-5 botões contornados em `flexWrap`, de larguras desiguais e quebra irregular. Parece "nuvem de botões", não um menu. | Média |
| UI-08 | Perfis | mesmos arquivos + `ExcluirContaSecao.tsx:38-49` | Header nativo branco "Perfil" (`AlunoTabs.tsx:101`) empilhado sobre banda preta full-bleed: duas faixas de topo [SUPOSIÇÃO visual: inferido do código]. "Excluir minha conta" em vermelho sólido na tela principal do perfil, acima do "Sair". | Média |
| UI-09 | Telas de gestor | `TurmasScreen.tsx`, `TurmaDetalheScreen.tsx`, `SessaoDetalheScreen.tsx`, `HistoricoScreen.tsx`, `TurmasDisponiveisScreen.tsx`, `Vincular*Screen.tsx` | Pilhas de `Cartao` com borda cinza e raio 8 (anti-padrão do `DESIGN_BRIEF.md:36`). As telas de gestor não receberam nenhum tratamento do redesign (`docs/REDESIGN_LOG.md:30`). | Média |
| UI-10 | Metadados com ponto médio | `AgendaScreen.tsx:99`, `TurmasDisponiveisScreen.tsx:100`, `MissoesGestorScreen.tsx:145`, `SessaoDetalheScreen.tsx:140`, `TurmaDetalheScreen.tsx:173`, `TurmasScreen.tsx:235`, `professor/DashboardScreen.tsx:196` | Violação direta do `DESIGN_BRIEF.md:26` ("Não junte metadados com ponto médio"). | Média |
| UI-11 | Enums crus na UI | `SessaoDetalheScreen.tsx:116,140`, `TurmaDetalheScreen.tsx:240`, `professor/DashboardScreen.tsx:196` | Texto "status: agendada/aberta/encerrada/pendente" em minúsculas, como log de sistema. `TurmasScreen.tsx:164` exibe níveis sem acento ("intermediario", "avancado", visto na Galeria). | Média |
| UI-12 | Números | `professor/DashboardScreen.tsx:304`, `academia/DashboardScreen.tsx:191`, `VisaoConsolidadaScreen.tsx:106,111` | Contadores grandes em fonte do sistema 700, não Oswald. Quebra o idioma de "placar". | Média |
| UI-13 | Medalha | `Medalha.tsx:30-63` | Emblema de 3 círculos cinza: parece controle de UI (radio/knob), sem iconografia, sem número e sem forma de luta. | Média |
| UI-14 | Pódio | `Podio.tsx:39-64` | Sem degraus nem alturas. O destaque do 1º lugar é só um avatar maior e fundo `#F4F4F4`. | Média |
| UI-15 | Faixa/graduação | `SeloFaixa.tsx:14-39` | A graduação, o principal marcador de status de um lutador, é texto livre numa pílula preta, sem a cor da faixa nem os graus. | Média |
| UI-16 | `CartaoSessao` | `CartaoSessao.tsx:41`, `BotaoCheckIn.tsx:52,61` | Ícone de estado repetido (leading + trailing). O texto do estado "fora da janela" quebra em 2 linhas alinhado à direita. | Baixa |
| UI-17 | Botão "‹ Voltar" | `Botao.tsx:96` + `SelecaoPerfilScreen.tsx:49`, `RecuperarSenhaScreen.tsx:51`, `ConsentimentoLGPDScreen.tsx:38`, `Cadastro*Screen.tsx` | Link de voltar centralizado no topo (render), em vez de alinhado à esquerda como back padrão. O caractere "‹" é o próprio ícone. | Baixa |
| UI-18 | Raios | `Botao.tsx:88` (4), `BotaoCheckIn.tsx:95` (8), `Etiqueta.tsx:42` (16), `ModalitySelector.tsx:81` (20) | Quatro raios para elementos de mesma família (botões/chips). Não comunica o "canto vivo" pedido em `script.md:33`. | Baixa |
| UI-19 | Barra de progresso | `BarraProgresso.tsx:50` | Segmento vazio `#F4F4F4` sobre `#FFFFFF` (1,10:1), praticamente invisível. A barra parece "acabar" no preenchimento. | Baixa |
| UI-20 | Hierarquia de seções | `aluno/DashboardScreen.tsx:162,257` vs `TurmasScreen.tsx:248` | Título de seção 16/600 numa tela e 20/700 em outra. Sem componente de cabeçalho de seção. | Baixa |
| UI-21 | Consentimento | `ConsentimentoLGPDScreen.tsx:62,94-95` | O checkbox marcado é um quadrado preto cheio, sem ✓ (render). O texto da política é placeholder num box de borda cinza. | Baixa |
| UI-22 | Ícones | `icones/index.tsx` (todos) | Default `'#0A0A0A'` hardcoded em vez de `Cores.preto`. `IconeFaixa`/`IconePoste` pouco legíveis a 24px. | Baixa |

---

## 6. Problemas de UX

### 6.1 Fluxos e navegação
- **UX-01, Alta. Check-in não é o centro da Home.** `aluno/DashboardScreen.tsx:114-199`: a ordem é banda de identidade → chips de modalidade → barra de XP → sequência → "Próximos treinos" → CTA de 12px. Em 375×812 o check-in provavelmente fica perto da dobra [SUPOSIÇÃO: tela autenticada não renderizada]. RNF01 pede ≤3 toques, e isso ainda é cumprido, mas a ação não tem destaque.
- **UX-02, Média. Links importantes como texto cinza de rodapé.** "Turmas disponíveis" e "Histórico" (`aluno/DashboardScreen.tsx:191-198`) e "Gerenciar turmas" (`professor/DashboardScreen.tsx:245-249`, `academia/DashboardScreen.tsx:140-144`) são texto 14px `#6B6B6B` sem ícone, seta ou affordance, com área de toque menor que 44px.
- **UX-03, Média. "Meus vínculos" não mostra os vínculos.** `PerfilAlunoStack` titula `VincularAlunoScreen` como "Meus vínculos" (`AlunoTabs.tsx:103`), mas a tela só lista academias/professores para solicitar (`VincularAlunoScreen.tsx:100-121`). O estado "Solicitado" é um `Set` local (`:25,55`) que se perde ao sair: o usuário pode pedir de novo e não vê pendências.
- **UX-04, Média. Lista de vínculo sem busca.** `VincularAlunoScreen.tsx:108-120` e `VincularProfessorScreen.tsx:77-92` listam todas as academias/professores do sistema, sem busca, filtro por cidade ou ordenação. Isso não escala.
- **UX-05, Média. Formulário de criação no topo da lista.** `TurmasScreen.tsx:155-216`: "Nova turma" (8+ campos) vem antes de "Minhas turmas" (`:217`). O gestor que entra para consultar precisa rolar o formulário inteiro. O mesmo acontece em `TurmaDetalheScreen.tsx:206-225` ("Nova sessão" entre "Matriculados" e "Sessões").
- **UX-06, Média. "Nova sessão" ambígua.** `TurmaDetalheScreen.tsx:207-215` pede **dias da semana** e **data** ao mesmo tempo, sem explicar qual prevalece.
- **UX-07, Baixa. Ranking rotulado "mensal" mas cumulativo.** `ClassificacaoScreen.tsx:93` mostra "Ranking mensal", e `docs/DECISOES_PENDENTES.md:27` confirma que não há reset (RN04 não implementada). Também usa só o 1º vínculo, sem seletor de escopo (`docs/DECISOES_PENDENTES.md:88`).
- **UX-08, Baixa. Missões do aluno sem filtro.** `MissoesScreen.tsx:79-93` não usa `Abas` (em curso/concluídas/do professor, pedido em `DESIGN_BRIEF.md:48`), embora o componente exista.
- **UX-09, Baixa. Exclusão de conta exposta e não funcional.** Está na tela principal do Perfil (`ExcluirContaSecao` nos 3 perfis) e hoje sempre falha (`docs/DECISOES_PENDENTES.md:11-18`).

### 6.2 Feedback (loading, erro, sucesso, vazio)
- **UX-10, Alta. Erros técnicos crus.** 37 ocorrências de `setErro(e.message)` em `src/screens/` (ex.: `aluno/DashboardScreen.tsx:72,106`, `professor/DashboardScreen.tsx:70`, `VincularAlunoScreen.tsx:39,56`). O tradutor `mensagensErro` só é usado nas 5 telas de auth. O usuário pode ver mensagens do Firebase em inglês ("Missing or insufficient permissions").
- **UX-11, Média. Loading inconsistente.** `AgendaScreen.tsx:82-86` e os dashboards (`aluno/DashboardScreen.tsx:171`, `professor/DashboardScreen.tsx:171,210`) usam `ActivityIndicator`. As outras telas usam `Esqueleto`. O `Esqueleto` não reproduz a forma do conteúdo (blocos de 48-96px).
- **UX-12, Média. Sem feedback de sucesso.** Matricular (`TurmasDisponiveisScreen.tsx:103-109`), solicitar vínculo, criar turma/sessão/missão, salvar perfil, aceitar/recusar e marcar presença só trocam o rótulo do botão ou recarregam a lista. `Aviso` não tem variante de sucesso (`Aviso.tsx:8`). `EditarPerfilScreen.tsx:171` usa `Aviso` sempre com `tipo="erro"`.
- **UX-13, Média. Erro do Dashboard sem retry.** `aluno/DashboardScreen.tsx:168` mostra texto vermelho sem "Tentar novamente", e o mesmo ocorre em `AgendaScreen.tsx:91`, `professor/DashboardScreen.tsx:164-168` e `academia/DashboardScreen.tsx:106`. Só as telas de lista usam `EstadoErro`.
- **UX-14, Baixa. Loading textual "...".** O botão de presença mostra `'...'` (`professor/DashboardScreen.tsx:232`) em vez de spinner.
- **UX-15, Baixa. Estados vazios sem CTA.** `EstadoVazio` sem ação em Histórico (`HistoricoScreen.tsx:82`), Missões, Classificação ("Faça check-in..." sem botão para a Agenda), Turmas disponíveis (sem link para vincular) e Alunos.
- **UX-16, Média. Celebração só para o professor.** `CelebracaoGraduacao` é exibida para quem registra a graduação (`RegistrarGraduacaoScreen.tsx:98-109`), não para o aluno que foi graduado. Subida de nível de XP, medalha conquistada e sequência não têm nenhum momento de celebração.

### 6.3 Formulários
- **UX-17, Média. Datas e horas como texto livre.** "DD/MM/AAAA" e "HH:MM" sem máscara nem picker (`CadastroAlunoScreen.tsx:184-191`, `TurmasScreen.tsx:196-199`, `TurmaDetalheScreen.tsx:213-215`, `RelatorioFrequenciaScreen.tsx:60-63`). Os de gestor nem usam `keyboardType="number-pad"`.
- **UX-18, Média. Placeholder parece valor.** O placeholder `#757575` é quase igual ao texto e "••••••••" na senha parece senha já preenchida (render `mobile-01-login`).
- **UX-19, Média. Teclado cobre campos [SUPOSIÇÃO: comportamento nativo não testado].** `Folha` com 5 campos (`MissoesGestorScreen.tsx:161-186`) não tem `KeyboardAvoidingView` nem scroll. `TurmasScreen` e `TurmaDetalheScreen` (formulários longos) também não têm `KeyboardAvoidingView`.
- **UX-20, Baixa. Faixa como texto livre.** `CadastroAlunoScreen.tsx:176-182` impede representar a faixa visualmente (cor, graus) e padronizar ranking por graduação.
- **UX-21, Baixa. Botão "Criar turma" desabilitado sem explicação.** O botão fica desabilitado (`TurmasScreen.tsx:215`) sem indicar o motivo. Isso contrasta com o Login, que valida no envio.
- **UX-22, Baixa. Sem visibilidade de senha nem `textContentType`/`autoComplete`.** Prejudica o preenchimento automático (`LoginScreen.tsx:73-90`).

### 6.4 Microinterações e estados
- Feedback de toque é só o `TouchableOpacity` (opacity 0.2 padrão), sem `Pressable` com estado pressed, escala ou haptics (`expo-haptics` ausente).
- Não há estado de hover no web (`Botao`, `Etiqueta`, linhas de lista).
- **Foco:** `semAnelDeFoco` (`outlineWidth: 0`) está aplicado em `Botao.tsx:4,49,66`, `ModalitySelector.tsx:8`, `SelecaoPerfilScreen.tsx:16`, `ConsentimentoLGPDScreen.tsx:24` e `CadastroProfessorScreen.tsx:23`. No `CampoTexto` o foco não tem indicador (medido: `outline: 0px`, borda continua `#D9D9D9`). Botões-link ainda mostraram anel no render (`mobile-03/04`).
- Desabilitado é só `opacity: 0.4` (`Botao.tsx:92`, `Etiqueta.tsx:47`).
- Motion existente: punch no check-in (`BotaoCheckIn.tsx:26-42`), entrada da celebração (`CelebracaoGraduacao.tsx:22-30`) e shimmer. Não há transição de número (XP subindo), preenchimento animado da barra nem transição entre abas. Nenhuma das animações, exceto o Esqueleto, respeita reduce motion.

---

## 7. Responsividade

| Tela/grupo | Mobile (375) | Tablet (768) | Desktop web (1440) |
|---|---|---|---|
| Login | OK. Muito espaço vazio abaixo do botão. | Igual ao mobile esticado, inputs com 720px | **Inputs e botão com ~1392px** de largura (render `desktop-01-login`), logo pequeno centralizado, formulário colado à esquerda/direita |
| Seleção de perfil | OK | Descrições em 1 linha longa | Título à esquerda, "‹ Voltar" no centro, linhas de 1392px (render `desktop-05`) |
| Consentimento / Cadastros / Recuperar | OK, formulário longo (Cadastro Aluno ~1050px de altura com erros) | Chips em uma linha só; inputs 720px | Inputs full-width; sem coluna central |
| Home/Perfil (banda preta) | [SUPOSIÇÃO] OK em largura. **Topo sem safe area**: `paddingTop: 32` fixo (`aluno/DashboardScreen.tsx:213`) com `headerShown: false` (`AlunoTabs.tsx:55`); em iPhone com notch/Dynamic Island (inset ~47-59px) o avatar/nome fica sob a status bar | Banda e listas esticadas; marca d'água fixa em 220px fica pequena | Igual, sem `maxWidth` |
| Listas (Agenda, Histórico, Turmas, Alunos…) | OK | Linhas muito largas, botões de ação longe do texto | Idem; sem grid de 2 colunas |
| Tab bar | [SUPOSIÇÃO] `height: 64` e `paddingBottom: 8` fixos (`opcoesCasca.ts:36-38`) sobrescrevem a altura que o bottom-tabs calcula com o inset inferior: em iPhone com home indicator, os rótulos devem ficar colados ou sobrepostos ao indicador | OK | OK, mas a tab bar de app mobile no desktop é estranha |
| Modais (`Dialogo`, `Celebracao`) | OK (maxWidth 360) | OK | OK |
| `Folha` | OK | Ocupa a largura toda | Folha de 1440px de largura |

Também observado:
- `app.json:6` trava portrait, mas `ios.supportsTablet: true` (`app.json:9`) publica no iPad sem layout adaptado.
- Não há tratamento para fonte grande do sistema (Dynamic Type/escala de fonte). A tab bar com altura fixa e os textos de 12px com `maxWidth: 120` (`BotaoCheckIn.tsx:118`) devem quebrar [SUPOSIÇÃO]. Os nomes nas bandas usam `adjustsFontSizeToFit` (`aluno/DashboardScreen.tsx:132`), que encolhe nomes longos sem limite mínimo.
- `StatusBar style="light"` é montado no Dashboard (`aluno/DashboardScreen.tsx:117`, `professor/DashboardScreen.tsx:135`) e as abas mantêm a tela montada. Ao trocar para abas com header branco, os ícones da status bar tendem a continuar brancos sobre branco [SUPOSIÇÃO: comportamento de pilha do `expo-status-bar`, não verificado em dispositivo].

---

## 8. Acessibilidade

### 8.1 Contraste (WCAG 2.1, calculado)

| Par | Razão | Resultado | Onde |
|---|---|---|---|
| `cinzaClaro #757575` sobre `preto #0A0A0A` | **4,30:1** | Reprova texto normal (4,5) | `aluno/PerfilScreen.tsx:175` (membro desde, 12px), `professor/PerfilScreen.tsx:106-107`, `academia/PerfilScreen.tsx:107-108`, `academia/DashboardScreen.tsx:179` (endereço) |
| `cinzaClaro` sobre `cinzaFundo #F4F4F4` | **4,19:1** | Reprova | `Medalha.tsx:62` (rótulo bloqueada, ainda com opacity 0.6 na moldura) |
| `cinzaBorda #D9D9D9` sobre branco | **1,41:1** | Reprova 1.4.11 (UI 3:1) | sublinhado do `CampoTexto` (`CampoTexto.tsx:36`), único limite visual do campo; bordas de `Cartao` |
| `cinzaFundo` sobre branco | **1,10:1** | Reprova 1.4.11 | trilha vazia de `BarraProgresso.tsx:50`, `CartaoMissao.tsx:43` |
| `impacto #1B9E3E` sobre branco | 3,50:1 | Só UI/texto grande | flash (decorativo, OK) |
| `cinzaMedio #6B6B6B` sobre branco / `#F4F4F4` | 5,33 / 4,85 | Aprova | texto secundário |
| `checkinValidado #2E7D32` sobre branco | 5,13 | Aprova | |
| `alerta #B3261E` sobre branco / branco sobre alerta | 6,54 | Aprova | |
| Botão desabilitado (opacity 0.4) | — | Fora do escopo do WCAG para desabilitado, mas o rótulo fica pouco legível | `Botao.tsx:92` |
| Título Homebase com sombra preta | — | Ilegível (ver UI-01), falha prática de legibilidade | auth |

### 8.2 Labels, roles e leitores de tela
- `CampoTexto` não passa `accessibilityLabel` ao `TextInput` (`CampoTexto.tsx:19-25`): o leitor anuncia o placeholder, não o rótulo. O erro (`:26`) não é anunciado (sem `accessibilityLiveRegion`/role alert). Isso afeta todos os formulários.
- `TextInput` cru sem label em `RegistrarGraduacaoScreen.tsx:76-82`, `RelatorioFrequenciaScreen.tsx:60-63`, `MissoesGestorScreen.tsx:166-182` e `ModalitySelector.tsx:61`.
- Pílulas do `ModalitySelector` sem `accessibilityRole`/`accessibilityState` (`ModalitySelector.tsx:44-58`): não anunciam "selecionado".
- `TouchableOpacity` de links sem `accessibilityRole="link|button"`: `aluno/DashboardScreen.tsx:163,192,195`, `professor/DashboardScreen.tsx:246`, `academia/DashboardScreen.tsx:141`.
- `Etiqueta` usada como toggle anuncia "botão, selecionado" em vez de "switch, ativado" (`PreferenciasNotificacaoScreen.tsx:69-75`), embora o `accessibilityLabel` compense parcialmente.
- Imagem decorativa da marca d'água (`aluno/DashboardScreen.tsx:125-129` e as outras 5 bandas) sem `accessible={false}`/`accessibilityElementsHidden`.
- Pontos positivos: `Abas` com `tablist/tab`, `Botao` com `accessibilityState` (disabled/busy), `BarraProgresso` com `progressbar` + `accessibilityValue`, `Esqueleto` oculto do leitor, `Dialogo` com `accessibilityViewIsModal`, `Avatar` com label, logo com `accessibilityLabel="RoundUp"` (`LoginScreen.tsx:61`).

### 8.3 Teclado e foco (web)
- Ordem de Tab no Login (render): link "Esqueci" → "Entrar" → "Cadastre-se". Os inputs recebem foco, mas **sem indicador visível** (computed: `outline-width: 0px`, `border-bottom-color: rgb(217,217,217)` inalterado), o que reprova WCAG 2.4.7.
- `semAnelDeFoco` remove o outline intencionalmente em botões e pílulas (lista em §6.4), sem substituto.
- `Folha`/`Dialogo` usam `Modal` do RN; o foco não é aprisionado nem devolvido no web [SUPOSIÇÃO].
- Enter no campo de senha não submete o login (sem `onSubmitEditing`/`returnKeyType`, `LoginScreen.tsx:83-90`).

### 8.4 Alvos de toque e semântica
- Bom: `Botao` e `BotaoCheckIn` têm `minHeight/minWidth: 44`, `Etiqueta` tem `hitSlop` 8 e `Botao` texto `hitSlop` 12.
- Ruim: os links de rodapé (UX-02) e "ver agenda" (`aluno/DashboardScreen.tsx:163-165`) não têm `hitSlop` e ficam com ~20px de altura.
- Semântica web: tudo vira `<div>`. Não há `accessibilityRole="header"` nos títulos de tela/seção (grep: 0), o que impede a navegação por cabeçalhos no leitor.

### 8.5 Movimento
- `BotaoCheckIn` (scale 1.25 + flash) e `CelebracaoGraduacao` não checam `isReduceMotionEnabled`. Só o `Esqueleto` checa (`Esqueleto.tsx:19-23`).

---

## 9. Coerência com a temática ("de lutador para lutador")

**Reforça:**
- Logo do ringue com 4 postes e cordas + lettering "RNDP" (`assets/roundup_logo.png`): forte, preto e branco puro, com ângulos.
- Iconografia própria do universo de luta: luva (check-in, Treinar), ficha técnica (Agenda), cartão de pontuação do juiz (Classificação), tatame (Turmas), sino (Hoje), cadeado (janela fechada) (`icones/index.tsx`). Nada de halteres ou coração.
- Oswald condensado para XP, nível e posições, com o idioma de placar (`BarraProgresso.tsx:47`, `IndicadorSequencia.tsx:21`, `LinhaClassificacao.tsx:29-31`).
- Homebase como fonte de marca (quando legível, ver Galeria): caixa alta pesada, com cara de cartaz.
- Barra de XP segmentada "por round" (`BarraProgresso.tsx:13-16`), divisor duplo "corda" (`LinhaFina.tsx:4-12`), banda preta full-bleed com marca d'água.
- Vocabulário: "Treinar", "Hoje", "Chamada", "Faixa", "Graduação".
- Punch + flash no check-in (`BotaoCheckIn.tsx:19-42`).

**Contradiz / enfraquece:**
- **Fundo branco dominante e tipografia de sistema** em 100% das telas: estética de app corporativo e formulário, o oposto de academia, ringue e noite de luta.
- **Os elementos temáticos estão quase invisíveis:** lona a 5–8%, marca d'água a 12%, corte diagonal só na Galeria e não usado em nenhuma tela, corda (`IconeCorda`) sem uso.
- **Sombra dura ilegível** (UI-01): o único recurso de "cartaz de luta" aplicado aos títulos piora a leitura.
- **Faixa sem cor:** em artes marciais, a cor da faixa é a identidade. Aqui é texto numa pílula preta.
- **Medalha cinza, pódio sem pódio e celebração num modal branco discreto:** a progressão, que é o "porquê" de um lutador voltar, não tem peso visual.
- **Check-in de 12px:** a ação "bati o ponto no treino" deveria ser o gesto central, como bater luva.
- **Ícone do app e splash do Expo:** zero identidade fora do app.
- **Telas de gestor** com cards de SaaS, "status: aberta" e enums crus: tom de planilha, não de corner/treinador.
- Cor só funcional (`DESIGN_BRIEF.md:19`) levada ao extremo resulta em um app sem nenhum ponto de calor. Cartaz de luta, ringue e fita de luva usam vermelho/azul de corner, que é vocabulário funcional do esporte (canto vermelho vs. azul) e não decoração. Esse é um ponto a decidir (ver §12).

---

## 10. Restrições técnicas

**O que dificulta o redesign:**
1. **Estilos espalhados por tela.** Cada tela tem seu `StyleSheet` com combinações livres de token. Não há primitivos de layout (`Tela`, `Secao`, `Pilha`, `Texto` com variantes). Mudar a hierarquia tipográfica exige editar ~35 arquivos.
2. **Bandas de identidade duplicadas em 6 arquivos** (UI-06). Qualquer ajuste precisa ser replicado à mão.
3. **Três camadas de tokens:** `theme/tokens.ts` mais os aliases legados `Colors`/`FontSize`, ainda importados em `LinhaFina.tsx`, `LoadingScreen.tsx`, `CampoTexto.tsx`, `ModalitySelector.tsx` e `AgendaScreen.tsx`.
4. **Sem tema dinâmico:** `Cores` é `const` estático importado direto. Dark mode ou troca de tema exige migrar para hook/contexto (`useTema()`) ou aceitar um tema único fixo.
5. **Sem safe area** em lugar nenhum: introduzi-la mexe no topo de todas as telas com `headerShown: false` (auth, 3 dashboards).
6. **Motion limitado:** sem Reanimated, efeitos mais ricos (contador de XP, barra com spring, gestos na folha) ficam trabalhosos com `Animated`. Adicionar `react-native-reanimated` e `expo-haptics` exige aprovação (`script.md:76`). Pelo `AGENTS.md`, também é preciso consultar a doc do SDK 57 antes.
7. **Sem gradiente/blur:** efeitos "metálicos" e "glow" exigem `expo-linear-gradient` ou SVG `LinearGradient` (o `react-native-svg` já está instalado e suporta).
8. **Documentos de direção conflitantes:** `DESIGN_BRIEF.md` (cor só funcional, sem caixa alta, Homebase só em título) vs `script.md` (efeito "batida", gradiente metálico, cortes) vs `docs/AUDITORIA_UI.md` (cita um SCRIPT antigo com `brass #C9A227` e fundo `#0C0C0D`). A IA que for planejar precisa de uma fonte única.
9. **Homebase** é uma fonte só de caixa alta (render) e entra em conflito com a regra "não use CAIXA ALTA" do brief. A licença do arquivo `homebase.ttf` não está documentada [SUPOSIÇÃO: verificar uso comercial].
10. **Telas autenticadas não testáveis localmente sem produção:** não há emulador de Auth/Firestore no client (`src/services/firebase.ts`). Isso dificulta validar o redesign visualmente. A Galeria é o único ambiente seguro.

**O que facilita:**
- Tokens já centralizados e bem nomeados (`src/theme/tokens.ts`), com comentários de intenção. Trocar a paleta é barato.
- Biblioteca própria de 25 componentes, sem dependência de lib de UI externa e sem CSS acoplado.
- `GaleriaScreen` funciona como Storybook para validar componentes sem backend.
- Ícones SVG próprios e parametrizáveis (`tamanho`, `cor`, `espessura`).
- Casca de navegação centralizada em `opcoesCasca.ts`: header e tab bar mudam num arquivo só.
- `react-native-svg` já instalado (cortes, padrões, gradientes SVG, formas de faixa).
- Estados de loading/erro/vazio já têm componentes (`Esqueleto`, `EstadoErro`, `EstadoVazio`), só falta adotar em todas as telas.

---

## 11. Recomendações priorizadas (impacto visual × esforço)

Esforço: **P** ≤ 0,5 dia, **M** 1-3 dias, **G** > 3 dias.

### Prioridade 1: alto impacto, baixo esforço

| # | O que mudar | Onde | Por quê | Esforço |
|---|---|---|---|---|
| R1 | Remover `Sombras.duraTitulo` de títulos pretos sobre fundo claro, ou trocar por sombra em **cor de acento/cinza médio** com offset 2/2 e `letterSpacing: 1`. Validar na Galeria. | `tokens.ts:91-97`; usos em `SelecaoPerfilScreen.tsx:92`, `RecuperarSenhaScreen.tsx:97`, `ConsentimentoLGPDScreen.tsx:82`, `Cadastro*Screen.tsx` | Título hoje ilegível (UI-01) | P |
| R2 | Trocar ícone, adaptive icon e splash pelo logo RNDP (fundo `#0B0B0C`, marca branca) e configurar `expo-splash-screen` com `backgroundColor` e `image`. | `assets/icon.png`, `assets/android-icon-*.png`, `assets/splash-icon.png`, `app.json:13-22` | Identidade fora do app (UI-02). Precisa do arquivo de marca. | P |
| R3 | Aplicar safe area: `SafeAreaProvider` em `App.tsx` e `useSafeAreaInsets()` no topo das telas `headerShown:false`. Remover `height`/`paddingBottom` fixos da tab bar ou somar `insets.bottom`. | `App.tsx`, bandas dos dashboards, `opcoesCasca.ts:32-39` | Conteúdo sob notch/home indicator (§7) | P |
| R4 | Container com `maxWidth: 480` centralizado (auth/forms) e `maxWidth: 720` (listas) para web/tablet. | novo `components/ui/Tela.tsx`; telas de auth primeiro | Layout esticado a 1392px (render desktop) | P |
| R5 | Indicador de foco: borda inferior 2px na cor de acento/preto no `CampoTexto` em foco; trocar `semAnelDeFoco` por anel custom (2px offset 2) só em `:focus-visible` no web. Sublinhado em repouso com ≥3:1 (ex.: `#8A8A8A` no claro). | `CampoTexto.tsx:34-44`, `Botao.tsx:4`, `ModalitySelector.tsx:8` | WCAG 2.4.7 e 1.4.11 | P |
| R6 | `accessibilityLabel={rotulo}` no `TextInput` do `CampoTexto`; erro com `accessibilityLiveRegion="polite"`; roles nas pílulas e links. | `CampoTexto.tsx:19-26`, `ModalitySelector.tsx:44-58`, `aluno/DashboardScreen.tsx:163,192,195` | A11y básica | P |
| R7 | Mapear erros do Firestore para mensagens em PT (estender `utils/mensagensErro.ts`) e usar `EstadoErro` com retry nos 4 dashboards e na Agenda. | 37× `setErro(e.message)` | Mensagens técnicas em inglês (UX-10/13) | P-M |
| R8 | Rótulos humanos para enums ("Agendada", "Aberta agora", "Encerrada"; "Intermediário", "Avançado") e eliminar o ponto médio, separando por peso/tamanho. | `SessaoDetalheScreen.tsx:116,140`, `TurmaDetalheScreen.tsx:173,240`, `TurmasScreen.tsx:235`, `professor/DashboardScreen.tsx:196`, `AgendaScreen.tsx:99`, `MissoesGestorScreen.tsx:145`, `TurmasDisponiveisScreen.tsx:100` | UI-10/UI-11, regra do brief | P |

### Prioridade 2: alto impacto, esforço médio

| # | O que mudar | Onde | Por quê | Esforço |
|---|---|---|---|---|
| R9 | **Adotar a direção visual "Noite de luta" (abaixo):** base escura, superfícies em camadas, um acento de corner. Expandir `Cores` com tokens semânticos (`fundo`, `superficie1/2`, `texto/texto2/texto3`, `linha/linhaForte`, `acento`, `sucesso`, `perigo`, `overlay`, `foco`) e migrar telas para os semânticos. | `src/theme/tokens.ts`; todas as telas (substituição em massa de `Cores.branco/preto` por semânticos) | Resolve UI-04 e a coerência temática (§9) | M-G |
| R10 | **Hero de check-in na Home:** card full-bleed do "Próximo treino" (turma, horário em Oswald 48, professor) com botão de check-in de 56px de altura, largura total, texto Oswald 20 caixa alta e ícone luva 24. Os 3 estados ocupam a mesma área: disponível = acento cheio; fora da janela = contorno + cadeado + contagem regressiva; feito = verde + check + "Treino registrado". A lista "Próximos treinos" fica abaixo, compacta. | `aluno/DashboardScreen.tsx:160-189`, novo `ui/HeroCheckIn.tsx`, `BotaoCheckIn.tsx` | UI-03/UX-01, RNF01 | M |
| R11 | **Componente `BandaIdentidade`** (avatar, nome, selo, subtítulo, textura, marca d'água, safe area) que substitui as 6 cópias. Uma variante para "aluno" (mais dramática) e uma para "gestor" (compacta). | 3 dashboards + 3 perfis | UI-06, manutenção | M |
| R12 | **Sistema tipográfico semântico:** componente `<Texto variante="display|titulo|secao|corpo|legenda|placar|placarXL|rotuloPlacar">`. Display = Homebase (só título de tela/hero, sem sombra preta); placar = Oswald 600/700 com `fontVariant: ['tabular-nums']`; corpo = sistema. Migrar todos os contadores de gestor para Oswald. Definir `lineHeight` por variante. | novo `ui/Texto.tsx`; `tokens.ts:44-53`; contadores em `professor/DashboardScreen.tsx:304`, `academia/DashboardScreen.tsx:191`, `VisaoConsolidadaScreen.tsx:106,111` | UI-12, UI-20, §4.2 | M |
| R13 | **Faixa com cor:** `SeloFaixa` vira uma faixa de tecido (retângulo com ponteira, SVG) na cor real da graduação + tarjas de grau. Exige um `faixa` estruturado (cor + graus) em vez de texto livre, com fallback para o texto atual. | `SeloFaixa.tsx`, `CadastroAlunoScreen.tsx:176-182`, `EditarPerfilScreen.tsx:145`, `types/index.ts` | UI-15, principal símbolo de status do lutador | M |
| R14 | **Perfis:** stats em Oswald grande; lista de configurações (linhas com ícone, rótulo e chevron, separadas por `LinhaFina`) no lugar da nuvem de botões; "Excluir conta" dentro de "Conta e privacidade", nunca na tela principal. | 3 `PerfilScreen.tsx`, `ExcluirContaSecao.tsx` | UI-07/UI-08, UX-09 | M |
| R15 | **Telas de gestor:** lista primeiro e criação via botão "+ Nova turma" que abre `Folha`/tela própria; listas sem card (linhas + `LinhaFina`, chips de status); `Botao` primário para a ação principal de sessão ("Abrir check-in" em acento, "Encerrar" destrutivo). | `TurmasScreen.tsx`, `TurmaDetalheScreen.tsx`, `SessaoDetalheScreen.tsx`, `professor/DashboardScreen.tsx:207-241` | UI-09, UX-05/06 | M |
| R16 | **Login com cara de luta:** fundo escuro full-screen, logo invertido 200px, tagline em Homebase/Oswald caixa alta, inputs em superfície escura, CTA em acento. Opcional: foto P&B de treino com overlay [depende de asset]. | `LoginScreen.tsx` | Primeira impressão (UI-05) | P-M |
| R17 | **Campos de data/hora:** máscara simples (`DD/MM/AAAA`, `HH:MM`) com `keyboardType="number-pad"` ou `@react-native-community/datetimepicker` (dependência nova, pedir aprovação). Unificar todos os `TextInput` crus em `CampoTexto`. | §6.3 UX-17 + `RegistrarGraduacaoScreen.tsx:76-82`, `RelatorioFrequenciaScreen.tsx:60-63`, `MissoesGestorScreen.tsx:166-182` | Consistência e erro de digitação | M |

### Prioridade 3: alto impacto, esforço alto ou dependente de decisão

| # | O que mudar | Onde | Por quê | Esforço |
|---|---|---|---|---|
| R18 | **Momentos de conquista para o aluno:** tela full-screen (não modal branco) para subida de nível, nova faixa e medalha: fundo preto, flash do acento, número em Oswald 96, "SUBIU DE NÍVEL" em Homebase, sino de round (som opcional) + haptic. Disparo no lado do aluno (detecção de mudança ao abrir a Home). | novo `ui/MomentoConquista.tsx`; `CelebracaoGraduacao.tsx`; `aluno/DashboardScreen.tsx` | UX-16; o porquê de voltar ao app | G |
| R19 | **Medalhas como emblemas:** SVG com forma de escudo/cinturão (fivela de cinturão de campeão), ícone temático por marco (luva = treinos, chama/corda = sequência, faixa = graduação), número em Oswald. Bloqueada = contorno tracejado. | `Medalha.tsx`, `utils/gamificacao.ts` (mapear ícone) | UI-13 | M |
| R20 | **Pódio real:** blocos com alturas 1º > 2º > 3º, número da posição em Oswald 48 dentro do bloco e acento só no 1º (cinturão). Linha do próprio aluno com barra lateral de acento. | `Podio.tsx`, `LinhaClassificacao.tsx` | UI-14 | M |
| R21 | **Motion:** adicionar `react-native-reanimated` + `expo-haptics` (aprovação) para contador animado de XP, preenchimento de barra com spring, haptic no check-in e pressed-state com escala 0.97 em botões (`Pressable`). Respeitar `reduceMotion` em tudo. | `BotaoCheckIn.tsx`, `BarraProgresso.tsx`, `Botao.tsx` | §6.4 | M-G |
| R22 | **Ilustrações de estado vazio/erro** com os próprios ícones em 64px + CTA (ex.: Classificação vazia → "Fazer meu primeiro check-in" → Agenda). | `EstadoVazio.tsx`, `EstadoErro.tsx` + chamadas | UX-15 | P-M |
| R23 | **Responsivo:** em ≥768px, grid de 2 colunas nas listas de gestor e Home com hero à esquerda e agenda à direita; tab bar vira rail lateral no web desktop (`tabBarPosition: 'left'` no bottom-tabs v7) [SUPOSIÇÃO: confirmar a opção na doc]. | `opcoesCasca.ts`, telas | §7 | G |

### Direção visual sugerida: "Noite de luta" (cartaz + ringue sob refletor)

Conceito: o app como **o ringue numa noite de evento**. Base escura de arena, superfícies como lona sob luz e um único acento de **corner vermelho** usado em CTA, posição, progresso e destaque. Mantém o DNA preto/branco do logo e da paleta atual e adiciona calor e hierarquia sem virar "app de fitness colorido".

**Paleta (dark-first; contrastes calculados):**

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `fundo` (lona noturna) | `#0B0B0C` | fundo de todas as telas | — |
| `superficie1` | `#161618` | cards, linhas destacadas, inputs | — |
| `superficie2` | `#222225` | folha, diálogo, pressed | — |
| `linha` | `#2C2C30` | separadores (decorativos) | 1,41 (decorativo, OK) |
| `linhaForte` | `#6E6E74` | borda de input, contornos de UI | 3,88 sobre `fundo`, 3,57 sobre `sup1` (≥3 OK) |
| `texto` | `#F4F2EE` (branco-osso, não puro) | texto principal | 17,6 / 16,2 |
| `texto2` | `#A8A6A1` | secundário | 8,09 / 7,43 |
| `texto3` | `#8A8884` | terciário, placeholder | 5,56 / 5,11 / 4,48 em `sup2` (evitar em `sup2`) |
| `acento` (corner vermelho) | `#F03A2E` | CTA, posição do aluno, barra de XP, foco | 5,01 sobre `fundo`, 4,60 em `sup1`. **Texto do botão em `#0B0B0C`** (5,01). Branco sobre ele dá só 3,93, use só para texto ≥ 18,66px bold. |
| `sucesso` | `#2FB457` | check-in feito, presença | 7,30 sobre `fundo`; tinta sobre ele 7,30 |
| `perigo` | `#FF4B3E` → reservar `#E5322D` para destrutivo | erro, destrutivo | 5,93 / 4,52 |
| `ouro` (opcional, só 1º lugar/cinturão) | `#D4A72C` | campeão do mês, medalha máxima | 8,77 sobre `fundo` |
| `papel` (variante clara opcional) | `#F2EFE8` | fichas técnicas, cartão de pontuação em contraste invertido | tinta 17,1 |

Regras:
- O acento aparece **no máximo 1-2 vezes por tela** (CTA + um destaque).
- `sucesso`/`perigo` continuam só funcionais.
- O `ouro` exige decisão (§12): ele contraria `DESIGN_BRIEF.md:19`.
- Cores de faixa (branca, azul, roxa, marrom, preta; ou prajied do Muay Thai) só dentro do `SeloFaixa`.

**Tipografia:**

| Papel | Família | Tamanho/peso | Uso |
|---|---|---|---|
| Display | Homebase | 40/32/24, caixa alta nativa, `letterSpacing 1-2`, sem sombra ou com sombra em `acento` 2/2 | título de tela/hero, momentos de conquista, wordmark |
| Placar | Oswald 700 | 96 (conquista) / 64 (hero) / 48 / 32 / 24, `tabular-nums`, `lineHeight` = 1.0-1.1× | XP, nível, posição, contadores, horário do hero |
| Rótulo de placar | Oswald 500/600 | 12-14, caixa alta, `letterSpacing 1.5` | "NÍVEL", "SEQUÊNCIA", "XP" (reverte a regra anti-caixa-alta do brief só nesse papel; decisão em §12) |
| Corpo | Sistema, ou Inter/Barlow via `expo-font` [opcional] | 16/14/12, `lineHeight` 1.4-1.5× | texto corrido, listas, formulários |

**Forma e componentes:**
- **Cantos vivos:** raio 2-4 em botões, inputs e cards. Pílula só em chips de filtro. O corte diagonal (`Geometria.corteDiagonal`) fica reservado ao hero de check-in e ao card de faixa, uma vez por tela.
- **Botão primário:** fundo `acento`, texto `fundo` em Oswald 600 16-18 caixa alta, altura 52-56, raio 2, pressed com escala 0.97 + escurecimento.
- **Botão secundário:** contorno `linhaForte` 1.5px e texto `texto`.
- **Inputs:** fundo `superficie1`, borda inferior `linhaForte` 1px, que vira `acento` 2px no foco; rótulo `texto2` 13 acima e placeholder `texto3`.
- **Listas:** sem cards, linhas sobre `fundo` separadas por `linha`. Linha "minha" com barra de 3px de `acento` à esquerda.
- **Cards** só para o hero e o card de faixa, em `superficie1`, sem borda, com textura de lona a 4-6% e corte diagonal.
- **Divisor de seção:** a `LinhaFina` dupla vira "corda" (2 linhas em `linha`) com título de seção em Oswald 14 caixa alta + contador à direita.
- **Tab bar:** `fundo`, ícone inativo `texto3`, ativo `texto` + traço de 2px de `acento` sobre o ícone. Altura = 56 + `insets.bottom`.
- **Motion:** "punch" (escala 1→1.08→1, 180ms) + haptic `impactMedium` no check-in. Contador de XP subindo (600ms ease-out). Conquista em tela cheia com flash de `acento` (2 frames) e entrada do número com overshoot. Tudo desligado com reduce motion.
- **Textura:** lona SVG atual (`TexturaLona`) a 4-6% em `fundo`, nas bandas e no hero. Marca d'água do logo só no Login e no Perfil.

---

## 12. Perguntas em aberto (decisões de marca/estilo)

1. **Claro ou escuro?** A proposta é dark-first ("noite de luta"). Hoje é `light` (`app.json:7`) e `DESIGN_BRIEF.md` não proíbe fundo escuro. Vale manter o claro como opção (tema duplo, esforço G) ou ficar só no escuro?
2. **Acento de cor:** o `DESIGN_BRIEF.md:19` proíbe acento decorativo e o `script.md:22` permite só variações. Aceita **um** acento "corner vermelho" (`#F03A2E`) como cor de ação e destaque? Ou prefere corner azul, ou manter 100% monocromático com o acento sendo o próprio branco?
3. **Ouro/cinturão** (`#D4A72C`) para o 1º lugar e a medalha máxima: entra ou não? (O `docs/AUDITORIA_UI.md:12` registra que um "brass" já foi proposto e não adotado.)
4. **Caixa alta:** o brief proíbe caixa alta como rótulo, mas Homebase é só caixa alta e o idioma de placar/cartaz usa caixa alta. Libera caixa alta em rótulos de placar (Oswald, 12-14px) e títulos Homebase?
5. **Sombra dura nos títulos** (`script.md:39`): remover, ou manter só em telas de destaque e em cor de acento?
6. **Faixa estruturada:** o produto deve modelar faixas e graus por modalidade (Muay Thai usa prajied/kruang; Boxe não tem faixa; BJJ/Judô/Karatê usam faixas) para desenhar o `SeloFaixa` com cor? Ou mantém texto livre? Isso afeta `types`, cadastro e Firestore.
7. **Assets de marca:** existe versão vetorial (SVG/AI) do logo RNDP e um símbolo isolado (só o ringue) para ícone de app e splash? Qual cor de fundo para o ícone (preto ou acento)?
8. **Licença da Homebase** (`assets/fonts/homebase.ttf`, sem documentação): permite uso comercial e embutido em app?
9. **Fotografia:** aceita usar fotos (P&B, treino real, luvas, ringue) no Login, nos estados vazios e nas celebrações? Há banco próprio da academia parceira ou será stock?
10. **Dependências novas:** aprova `react-native-reanimated`, `expo-haptics` e (opcional) `expo-linear-gradient` e `@react-native-community/datetimepicker`? E som (sino de round) no check-in/conquista?
11. **Tom das telas de gestor:** mesmo visual escuro do aluno, ou uma variante "operacional" (por exemplo, a variante clara `papel #F2EFE8` como "ficha técnica")?
12. **Plataforma web/tablet:** o web é alvo real de uso (gestor no computador da academia) ou só ferramenta de dev? Isso define o esforço de R4/R23 e se o `supportsTablet` (`app.json:9`) deve continuar ativo.
13. **Fonte única de verdade de design:** qual documento prevalece depois deste relatório? `DESIGN_BRIEF.md`, `script.md` ou um novo? Recomendo consolidar em um só antes do plano de redesign.
