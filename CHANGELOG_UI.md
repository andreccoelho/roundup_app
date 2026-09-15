# CHANGELOG_UI

Registro de decisões tomadas durante a construção da camada de interface do RoundUp (SCRIPT.md), passo a passo, e das pendências que ficaram em aberto. Não é changelog de commits — é o porquê das decisões, para retomar contexto depois.

---

## Passo 0 — Auditoria

- **Conflito `DESIGN_BRIEF.md` vs `SCRIPT.md` resolvido a favor de `DESIGN_BRIEF.md`.** A seção "Direção visual" do `SCRIPT.md` foi revogada por completo (fundo `#0C0C0D`, acento `brass`, escala tipográfica 32/24/20/17/15/13 e regra de cartão uniforme nunca entraram em vigor). `DESIGN_BRIEF.md` — paleta preto/branco/cinza, Oswald para placar, proibição de "kit de card de SaaS" — é a especificação visual oficial.
- Botão de teste temporário em `DashboardScreen.tsx`, que o `SCRIPT.md` presumia existir, não foi encontrado — item removido dos critérios de aceite.
- Navegação por abas não existia (só `native-stack`) — Passo 3 foi construção nova, não refatoração.

## Passo 1 — Tokens

- Fonte **Homebase** registrada em `App.tsx` com escopo estrito: só lettering "RNDP"/wordmark e título de tela — nunca placar (isso é Oswald) nem corpo de texto. Teste de glifos (cmap do `.ttf`) confirmou cobertura de `ã/ç/í` e variantes maiúsculas; avaliação visual de legibilidade/kerning em tamanho de título fica pendente de revisão humana na seção correspondente da Galeria.
- `src/theme/tokens.ts` consolida `src/constants/colors.ts` e `typography.ts` (que viraram reexports, para não quebrar os imports das telas do Ciclo 1) e acrescenta `Espacamento`, `Raios` e `DuracaoAnimacao`, que não existiam centralizados em lugar nenhum.

## Passo 2 — Componentes

- Três consolidações priorizadas antes de qualquer componente novo:
  - `BotaoCheckIn` + `CartaoSessao`: os 3 estados de check-in (RN08), antes duplicados em `aluno/DashboardScreen.tsx` e `aluno/AgendaScreen.tsx`.
  - `SolicitacoesScreen` única para Professor e Academia (antes duas telas quase idênticas) — corrigiu de quebra um bug latente: o fallback de nome da academia sempre assumia "Professor", ignorando que ela também recebe solicitação de aluno.
  - `Etiqueta`: os 3 chips reimplementados em `TurmasScreen`, `TurmaDetalheScreen` e `professor/DashboardScreen`.
- `Botao` ganhou as variantes `secundario`/`fantasma`/`destrutivo` (previstas no `SCRIPT.md`, nunca implementadas) e acessibilidade (`accessibilityRole`/`Label`/`State`, alvo 44×44) — necessário para a fusão de Solicitações reaproveitar componente base em vez de inventar botão local.
- `Campo` e `Divisor` do `SCRIPT.md` já existiam como `CampoTexto`/`LinhaFina` — não renomeados, para não tocar em todas as telas que os importam.
- **Pendência conhecida**: `CampoTexto` não tem variante "seleção" (só texto/senha) — nenhum consumidor precisou dela até agora.
- Copy do check-in ajustada para "Fazer check-in" (antes só "Check-in"), alinhando com `docs/roteiro-teste-ciclo1.md`.

## Passo 3 — Navegação

- Duas raízes de abas (`@react-navigation/bottom-tabs`), native-stack dentro de cada aba.
- RN05: `AlunoRaiz.tsx` decide entre `BloqueioVinculoScreen` (aluno sem vínculo ativo) e as abas, sem duplicar a checagem de vínculo em nenhum outro lugar.
- **Decisão do usuário**: consentimento LGPD do fluxo de onboarding do `SCRIPT.md` não foi implementado — RF28 é Ciclo 4, colocar um placeholder aqui seria antecipar escopo fora de ordem. Onboarding ficou splash → login → cadastro → vínculo.
- "Sair" centralizado nas 3 novas telas de Perfil (antes solto no cabeçalho de cada Dashboard).

## Ciclo 2 / parte do Ciclo 3 — gamificação com base provisória

Detalhamento completo em `docs/PLANO_REGRAS_CICLO2_3.md` (o que tinha service pronto vs. não) e `docs/DECISOES_PENDENTES.md` (9 itens numerados, cada um com o RF/RN, para checklist com a orientadora). Resumo das decisões mais relevantes para quem só lê este arquivo:

- `src/config/gamificacao.ts`: `XP_POR_CHECKIN_VALIDADO=10`, tabela de níveis (10 degraus, +50 por degrau), `JANELA_RANKING='mensal'` (hoje só rótulo — sem reset de período implementado), marcos de medalha. **Todos os números são provisórios**, sem base em pesquisa de balanceamento.
- Classificação (RF20) implementada com coleção nova `classificacoes/{alunoId}_{responsavelId}` — leitura aberta a qualquer autenticado (mesmo padrão já aceito para turmas ativas neste projeto; RN09 é garantida só pelo filtro da consulta, não pela regra). RNF11 (opt-in) e RN04 (reset por período) não implementadas.
- `missoesProgresso`: decidido que só o responsável escreve, nunca o aluno — mesmo espírito de RN01 (evitar progresso autodeclarado). Consequência: hoje nenhuma tela escreve progresso ainda (RF23, a tela de criação, ficou restrita aos campos que existem no tipo `Missao`).
- `graduacoes`: histórico imutável após criado (`update`/`delete: if false`), mesmo padrão de `consentimentosLGPD` — decidido pela opção mais simples em vez de permitir correção.
- **Correção de segurança real, não provisória**: a regra de `classificacoes.update` inicialmente só conferia quem escrevia, aceitando qualquer valor de `pontos` — um furo em RN01. Corrigida para travar o delta em exatamente ±`XP_POR_CHECKIN_VALIDADO` por escrita (o valor 10 é provisório; o mecanismo de trava não é). `checkins.ts` passou a escrever o valor já somado como literal em vez de `increment()`, para não depender de como o motor de regras resolve transforms.
- `tests/rules/bloqueadas.test.ts`: os 3 testes de "escrita negada" em `missoes`/`graduacoes`/`configuracoesGamificacao` passavam pelo motivo errado (payload incompleto, não regra de autorização). Corrigidos para usar payload bem formado e testar uma violação real (responsavelId de outro, aluno sem vínculo aceito). Nenhum resultado mudou de negado para permitido.
- `tests/rules/gamificacao.test.ts` (novo): 7 casos cobrindo especificamente a trava de delta de `classificacoes` — todos passando.
- RF24 (Alunos)/RF27 (Visão consolidada): implementados sem regra nova, compondo `turmas`/`matriculas`/`checkins` já desbloqueados (`src/services/frequencia.ts`) — confirma o achado do plano de que essas duas abas nunca precisaram de mudança em `firestore.rules`.
- `configuracoesGamificacao` (RF33) segue bloqueada — nenhum código lê/escreve nela ainda, os valores fixos do config substituem por enquanto.

---

## Checkpoint — fechamento da dívida de 5 telas do Ciclo 1

Depois do checkpoint anterior, esta rodada fechou a dívida nas 5 telas identificadas (`auth/*` — as 6 telas do fluxo —, `HistoricoScreen`, `TurmasDisponiveisScreen`, `VincularAlunoScreen`, `VincularProfessorScreen`) e o ajuste de contraste. Um commit por tela (`feat(ui)`/`refactor(ui)`).

- **Contraste corrigido**: `tabBarInactiveTintColor` das 3 raízes de abas trocou de `cinzaClaro` (2,10:1 sobre branco, abaixo do mínimo de 3:1 para UI) para `cinzaMedio` (5,33:1).
- **Telas de formulário puro** (`LoginScreen`, `RecuperarSenhaScreen`, `CadastroAlunoScreen`, `CadastroProfessorScreen`, `CadastroAcademiaScreen`): tokenizadas (`src/theme` direto, sem passar por `constants/`), `accessibilityRole="alert"` nas mensagens de erro/confirmação. Sem os 4 estados de carregando/vazio/erro de tela — são formulários sem busca de dados no mount, só ação de envio, já representada pelo `carregando` do `Botao`. `CadastroProfessorScreen` também ganhou `accessibilityRole`/`Label`/`State` e `minHeight: 44` no toggle Autônomo/Vinculado (2 `TouchableOpacity` soltos).
- **`SelecaoPerfilScreen`**: tokenizada; cada linha de opção (`TouchableOpacity` solto) ganhou `accessibilityRole="button"`, `accessibilityLabel` com título+descrição e `minHeight: 44`. Lista estática, 4 estados não se aplicam.
- **`HistoricoScreen`, `TurmasDisponiveisScreen`, `VincularAlunoScreen`, `VincularProfessorScreen`**: reconstruídas com os 4 estados de verdade (`Esqueleto`/`EstadoVazio`/`EstadoErro` com "tentar novamente"/conteúdo), linhas usando `Cartao` em vez de `borderWidth`/`borderColor`/`borderRadius` soltos, botões de ação (`Matricular`, `Solicitar vínculo`) trocados de `TouchableOpacity` cru para `Botao` (herda acessibilidade e 44×44). Erros de ação pontual (matricular, solicitar) viraram texto inline em vez de `Alert.alert` nativo — a falha de carregamento inicial é que vira `EstadoErro` de tela cheia.
- **`HistoricoScreen` não reaproveitou `CartaoSessao`**: aquele componente é orientado a ação (`BotaoCheckIn`, enum `EstadoCheckIn`); o histórico é só leitura com um enum diferente (`StatusCheckIn`) — forçar o componente errado esconderia o status real atrás de um rótulo que não é o dele. Ficou com `Cartao` + selo de status colorido (validado=verde, rejeitado=vermelho, pendente=cinza).
- **Achado novo, fora do escopo das 5 telas — não corrigido**: `professor/DashboardScreen.tsx`, `statusAguardando` (rótulo "Aguardando check-in") usa `Colors.cinzaClaro` sobre fundo branco — mesma falha de contraste do `tabBarInactiveTintColor` (2,10:1), mas em texto real, não UI de navegação, o que é uma falha mais séria (limiar de 4,5:1, não 3:1). Não fazia parte das 5 telas pedidas nesta rodada.
- Verificado (não é falha): `cinzaClaro` como `placeholderTextColor` e como fundo de botão desabilitado — WCAG exclui explicitamente placeholders e componentes de UI inativos/desabilitados da exigência de contraste.
- Suíte completa (`npx tsc --noEmit`, `npm run test:rules`) rodada depois de cada tela e no fechamento — sem regressão em nenhum ponto.
- **Ainda não fechado**: telas de gestor não tocadas (`gestor/TurmasScreen.tsx`, `TurmaDetalheScreen.tsx`, `SessaoDetalheScreen.tsx` — já sinalizadas na auditoria original como a leva mais antiga do Ciclo 1, de antes da padronização) e o achado de `professor/DashboardScreen.tsx` acima. Não estavam nas 5 telas desta rodada.
