# Prompt para o Claude Code: camada de interface do RoundUp

> Cole o bloco abaixo inteiro no Claude Code, na raiz do repositório `roundup_app`, com a branch `dev` atualizada.

---

## Contexto

Você é o desenvolvedor de front-end responsável pela camada de interface do **RoundUp**, aplicativo mobile em **React Native + Expo (SDK 57) + TypeScript**, backend **Firebase (Auth, Firestore, Storage)**. O app é um sistema gamificado de engajamento e retenção para academias de Boxe e Muay Thai, com três perfis de ator: **Aluno**, **Professor** e **Academia** (Academia é uma generalização de Professor, ou seja, acumula as permissões de gestão).

O produto já tem lógica de negócio, serviços e regras do Firestore implementados. **Seu trabalho é a camada de apresentação**: design system, biblioteca de componentes, navegação e refatoração das telas existentes. Não reescreva serviços, hooks de dados nem regras de segurança.

## Passo 0: auditoria antes de qualquer código

Leia o repositório inteiro antes de escrever uma linha. Em seguida entregue um arquivo `docs/AUDITORIA_UI.md` com:

1. Árvore de diretórios relevante (`src/`, `app/`, componentes, telas, navegação, serviços).
2. Inventário de telas existentes: caminho do arquivo, ator, requisito funcional que atende, estado atual (funcional, placeholder, morta).
3. Inventário de componentes reutilizáveis já existentes e quais estão duplicados entre telas.
4. Como a navegação está montada hoje (React Navigation ou Expo Router, quais stacks, como o perfil do usuário decide a rota).
5. Contratos de dados: tipos e interfaces que as telas consomem (`Usuario`, `Vinculo`, `Turma`, `Sessao`, `CheckIn`, etc.), com o caminho de cada um.
6. Dívidas visuais: estilos inline, cores hardcoded, magic numbers de espaçamento, ausência de estados de carregamento, erro e vazio.
7. Itens de limpeza conhecidos, incluindo qualquer botão de teste temporário em `DashboardScreen.tsx`.

**Pare aqui e aguarde meu aval antes de seguir para o Passo 1.**

## Direção visual

Revogada por completo — a direção visual oficial deste projeto é `DESIGN_BRIEF.md` (raiz do repositório), já implementada em `src/constants/colors.ts` e `src/constants/typography.ts`. Ignore qualquer menção anterior nesta seção a fundo `#0C0C0D`, acento único `brass`, escala tipográfica 32/24/20/17/15/13 ou regra de cartão uniforme (raio 12, borda 1px em tudo) — nenhum desses valores está em vigor.

Releia `DESIGN_BRIEF.md` inteiro antes de qualquer decisão visual nos passos seguintes, em especial: a paleta preto/branco/cinza com verde e vermelho como únicas cores funcionais (nunca acento decorativo); os três papéis tipográficos — Oswald para números e headlines de placar (já implementado via `@expo-google-fonts/oswald`), Homebase (`assets/fonts/homebase.ttf`, carregada em `App.tsx`) só para o lettering "RNDP"/wordmark e títulos de tela — nunca em placar, nunca em corpo de texto —, e uma sans neutra do sistema para corpo de texto; e os "Anti-padrões a evitar", em especial a proibição de tratamento uniforme de cartão entre tipos de conteúdo diferentes.

## Passo 1: fundação do design system

Crie `src/theme/` com:

- `tokens.ts`: cores, escala tipográfica, espaçamento (4, 8, 12, 16, 24, 32, 48), raios, duração de animação. Tudo tipado com `as const`.
- `typography.ts`: estilos nomeados por papel (`display`, `titulo`, `subtitulo`, `corpo`, `legenda`, `numero`), nunca por tamanho.
- `ThemeProvider.tsx` com hook `useTheme()`.
- `index.ts` exportando a superfície pública.

Carregue as fontes com `expo-font` em um gate de splash. Zero cor ou espaçamento hardcoded a partir daqui: qualquer valor literal em `StyleSheet` é erro de revisão.

## Passo 2: biblioteca de componentes

Crie `src/components/ui/`, um arquivo por componente, com props tipadas, estados de `pressed`, `disabled` e `loading`, `accessibilityRole` e `accessibilityLabel` em tudo que é tocável, e alvo de toque mínimo de 44x44.

Base: `Botao` (primário, secundário, fantasma, destrutivo), `Campo` (texto, senha, seleção), `Cartao`, `Etiqueta`, `Avatar`, `Divisor`, `Folha` (bottom sheet), `Dialogo`, `Aviso` (toast), `Abas`, `EstadoVazio`, `EstadoErro`, `Esqueleto` (shimmer de carregamento).

Domínio: `BotaoCheckIn`, `BarraProgresso` (XP para o próximo nível), `CartaoSessao`, `CartaoMissao`, `Medalha`, `IndicadorSequencia`, `LinhaClassificacao`, `SeloFaixa`, `CartaoAluno` (nome, faixa, frequência recente), `IndicadorFrequencia`.

Registre cada componente em uma rota de desenvolvimento `src/screens/dev/GaleriaScreen.tsx`, acessível só em `__DEV__`, mostrando todas as variantes e estados. É o que me permite revisar sem rodar cada fluxo.

## Passo 3: navegação

Duas raízes, espelhando a estrutura já validada no Figma:

- **Visão do Aluno**, abas: Treinar (home com check-in), Agenda, Missões, Classificação, Perfil.
- **Visão do Gestor**, usada por Professor e Academia, abas: Hoje, Turmas, Alunos, Missões, Perfil. O perfil Academia ganha, dentro dessa raiz, as telas adicionais de gestão de professores e visão consolidada.

Antes das raízes, um fluxo compartilhado de onboarding: splash, login, cadastro por perfil, consentimento LGPD, criação ou aceite de vínculo. Respeite a RN05: aluno sem vínculo ativo cai em uma tela de bloqueio que só oferece o caminho de vinculação, nunca uma home vazia.

A escolha da raiz vem do perfil do usuário autenticado, lida da fonte de verdade que já existe no projeto. Não duplique essa lógica.

## Passo 4: telas, por ciclo

Refatore ou implemente na ordem abaixo, sempre reaproveitando os componentes do Passo 2.

**Ciclo 1, núcleo.** Cadastro por perfil (RF01), login e recuperação de senha (RF02), perfis de academia, professor e aluno (RF04, RF05, RF06), solicitação e aceite de vínculo nas duas pontas (RF07, RF08), criação e gestão de turmas (RF10), matrícula em turma (RF11), criação de sessões com recorrência (RF12), check-in do aluno (RF13, RN02, RN08), agenda de próximos treinos (RF14), histórico de presenças (RF15).

**Ciclo 2, gamificação.** Nível e progresso de XP (RF17), missões ativas com progresso parcial (RF18), medalhas e marcos (RF19), classificação por escopo de vínculo com adesão opcional (RF20, RNF11), sequência de treinos consecutivos (RF21).

**Ciclo 3, gestão.** Fila de validação de check-ins (RF22), criação de missão personalizada (RF23), lista de alunos com frequência (RF24), registro de graduação de faixa (RF25, sempre como decisão humana explícita), relatório de frequência por turma e período (RF26), visão consolidada da academia (RF27).

**Ciclo 4.** Consentimento LGPD (RF28), exclusão de conta e dados (RF29), responsável legal para menores (RF30), preferências de notificação (RF31), sinalização de queda de frequência (RF32).

Cada tela nasce com os quatro estados implementados: carregando (esqueleto, não spinner centralizado), vazio, erro com ação de repetir, e conteúdo.

## Restrições técnicas

- Não altere serviços, repositórios, hooks de dados, tipos de domínio nem regras do Firestore. Se a UI precisar de um dado que não existe, pare e me avise em vez de inventar o acesso.
- Sem biblioteca de UI pronta. Nada de NativeBase, Tamagui, React Native Paper, gluestack. Componentes próprios sobre as primitivas do React Native.
- Dependências novas só com justificativa explícita e aprovação. `expo-font`, `expo-haptics` e `react-native-svg` estão liberados.
- `StyleSheet.create` sempre, estilo inline nunca.
- Suporte a Android 8.0+ e iOS 14+ (RNF05). Telas principais carregam em até 3s em 4G (RNF02): liste e evite renderizações desnecessárias, use `FlatList` com `keyExtractor` e `getItemLayout` onde couber.
- Ações offline preservam o estado visual otimista e indicam sincronização pendente (RNF06).
- TypeScript estrito, zero `any`.

## Fluxo de trabalho

Trabalhe em `feat/ui-design-system` a partir de `dev`. Um commit por passo, em português, no formato `feat(ui): ...` ou `refactor(ui): ...`. Ao fim de cada passo, pare, resuma o que mudou, liste os arquivos tocados e aguarde meu aval antes do passo seguinte. Edições cirúrgicas sempre que possível: preserve o que já funciona.

## Critérios de aceite

- [ ] `docs/AUDITORIA_UI.md` entregue e aprovado antes de qualquer código.
- [ ] Nenhuma cor, fonte ou espaçamento literal fora de `src/theme/tokens.ts`.
- [ ] Galeria de componentes rodando em `__DEV__` com todas as variantes.
- [ ] Check-in concluído em no máximo três toques a partir da home do aluno (RNF01).
- [ ] Todas as telas com os quatro estados, sem exceção.
- [ ] Todo elemento tocável com rótulo de acessibilidade e alvo de 44x44.
- [ ] Contraste mínimo de 4,5:1 para texto, verificado nos tokens.
- [ ] `npx tsc --noEmit` e o linter do projeto passando limpo.
- [ ] `CHANGELOG_UI.md` com o registro de decisões visuais tomadas e pendências.

## Primeira resposta esperada

Execute apenas o Passo 0 e me mostre a auditoria. Se algo na direção visual conflitar com o que você encontrar no repositório, aponte o conflito com o caminho do arquivo em vez de resolver por conta própria.