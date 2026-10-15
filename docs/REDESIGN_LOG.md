# Redesign "cara de luta" — log da rodada (script.md)

Executado em 8 fases, na ordem definida pelo próprio `script.md`, um commit por fase. Nenhuma lib nova instalada — Animated nativo do RN para motion, `react-native-svg` (já no projeto) para o que antes precisaria de clip-path/gradiente.

## Tokens novos (`src/theme/tokens.ts`)

| Token | Valor | Uso pretendido |
|---|---|---|
| `Cores.impacto` | `#1B9E3E` | Variante mais saturada do verde de sucesso, só para o flash de "impacto" no check-in. `checkinValidado` continua sendo o verde de uso normal (rótulos, selos). |
| `Sombras.duraTitulo` | offset `{3,3}`, sem blur | Sombra dura em títulos de tela (Homebase), via `textShadow*` nativo. |
| `Geometria.corteDiagonal` | `14` (% do lado, não px) | Corte diagonal de cards/selos — proporcional, desenhado num viewBox SVG 0-100 esticado. |
| `DuracaoAnimacao.dramatica` | `500` (ms) | Transição de subida de faixa/graduação — os outros tiers (`rapida`/`base`/`lenta`) continuam para tudo que não é esse momento específico. |

## Componentes alterados ou novos

- **`LinhaFina`** — linha dupla (corda de ringue), era uma linha só.
- **`Cartao`** — nova prop opt-in `corteDiagonal` (SVG); comportamento padrão inalterado.
- **`BarraProgresso`** — vira barra segmentada "por round" (10 segmentos); mesma API.
- **`Medalha`** — emblema com relevo falso (3 camadas de cinza + brilho deslocado); mesma API.
- **`TexturaLona`** (novo) — trama diagonal via SVG pattern, para fundo sutil de telas-chave.
- **`CelebracaoGraduacao`** (novo) — modal de celebração com entrada `dramatica`, substitui o toast simples de RegistrarGraduacaoScreen.
- **`Podio`** (novo) — top 3 do ranking em disposição 2º-1º-3º, avatar do 1º maior.
- **`BotaoCheckIn`** — shake + flash de `Cores.impacto` na transição para "realizado".
- **`SeloFaixa`** — sem mudança de componente; passou a ser usado no Perfil do Aluno e do Professor (antes só no Dashboard), no lugar de texto solto.
- **`Botao`** — avaliado e mantido como está: nenhuma instrução concreta do script.md se aplicava além do que já tinha (paleta monocromática, peso, variantes funcionais).

## Telas concluídas nesta rodada

1. Fundação de estilo (tokens) — commit `3274a15`
2. Componentes de base — commit `0893195`
3. Home do Aluno (`aluno/DashboardScreen.tsx`) — commit `df72dd1`
4. Motion de impacto (`BotaoCheckIn`, `CelebracaoGraduacao`/`RegistrarGraduacaoScreen`) — commit `6951a8a`
5. Perfil / badges (`aluno/PerfilScreen.tsx`, `professor/PerfilScreen.tsx`) — commit `199ce24`
6. Ranking (`aluno/ClassificacaoScreen.tsx`, `Podio`) — commit `3861c9e`
7. Telas de gestor (Professor/Academia) — **avaliado, sem mudança de código**: o próprio script.md pede tom "mais operacional, menos motion" para essas telas; os componentes de base (Fase 2) já propagam automaticamente para lá (`LinhaFina`, `Cartao`, ícones de luta já em uso desde o Passo 2) sem precisar de toque adicional. Ver "Pendências" abaixo.
8. Onboarding (`SelecaoPerfilScreen` + 3 telas de Cadastro + `ConsentimentoLGPDScreen` + `RecuperarSenhaScreen`) — commit `bcc6df4`

## Pendências / decisões já tomadas nesta rodada (não pedem validação nova)

- **Textura de lona**: sem asset de imagem real — implementada como padrão SVG procedural (decisão confirmada com o André antes de começar).
- **Motion**: `Animated` nativo do RN, sem `react-native-reanimated` (decisão confirmada com o André antes de começar — reanimated não estava instalado e os critérios de aceite do próprio script.md pedem para priorizar o que já existe).
- **Fase 7 (gestor)**: decisão de escopo, não pendência — script.md pede menos decoração ali, então nenhuma mudança de código foi feita além da propagação automática dos componentes de base.

## Nada quebrou

- Nenhuma mudança de API pública em componente já consumido em produção (`Cartao`, `BarraProgresso`, `Medalha`, `BotaoCheckIn`, `LinhaFina` continuam aceitando exatamente as mesmas props de antes).
- `npx tsc --noEmit` limpo depois de cada fase.
- Paleta monocromática (preto/branco/cinza + verde/vermelho funcionais) respeitada em 100% do trabalho — nenhuma cor decorativa nova, `Cores.impacto` é uma variante do verde funcional já existente, não uma cor nova.

---

# Redesign "Noite de luta" (docs/DESIGN.md)

Rodada baseada em `RELATORIO_UI_UX.md`. Regra de origem: `docs/DESIGN.md` (substitui `DESIGN_BRIEF.md`, `script.md` e `docs/AUDITORIA_UI.md`). Screenshots por fase em `docs/redesign/fase-N/` (375×812, 768×1024, 1440×900; Firebase bloqueado no navegador). "Antes" em `docs/redesign/antes/`.

Verificação por fase: `npx tsc --noEmit`. **Não há lint configurado no projeto** (sem ESLint, sem script `lint`); configurar exigiria dependências não aprovadas — ver `docs/DECISOES_PENDENTES.md`.

## Fase 1 — Fundação

- `src/theme/tokens.ts` reescrito com tokens semânticos: `fundo`, `superficie1/2`, `linha`, `linhaForte`, `texto/2/3`, `acento`, `sucesso`, `perigo`, `ouro`, `sobreCor`, `overlay`, `foco`; mais `CoresFaixa` (domínio, só SeloFaixa), `LarguraMaxima` (480/720), `Alturas`, `Raios` de canto vivo (`vivo` 2, `pequeno` 4, `pilula`), `Sombras.duraAcento`. Removidos: `placarLg`, `impacto`, `cinza*`, `checkinValidado`, `alerta`, `Sombras.duraTitulo`.
- Camadas legadas `src/constants/colors.ts` (`Colors`) e `src/constants/typography.ts` (`FontSize`) removidas; imports migrados para `src/theme`. Migração mecânica dos nomes antigos para os semânticos em todas as telas (refinadas nas fases 2-4).
- Ícones (`src/components/icones/index.tsx`) usam `Cores.texto` em vez de `'#0A0A0A'`.
- Novo `src/components/ui/Texto.tsx`: variantes `display`, `titulo`, `secao`, `corpo`, `corpoForte`, `legenda`, `rotuloPlacar`, `placar`, `placarGrande`, `placarXL`, com lineHeight, `tabular-nums` no placar e `accessibilityRole="header"` automático nos títulos.
- Novo `src/components/ui/Tela.tsx`: fundo do tema, safe area por borda (`topo`/`base`), coluna centralizada com `maxWidth` (480/720), ScrollView e KeyboardAvoidingView opcionais, `sobreposicao` fora da rolagem.
- `App.tsx`: `SafeAreaProvider` (com `initialWindowMetrics`), raiz em `fundo`, `StatusBar` `light` global. Os 3 `StatusBar` por tela dos dashboards foram removidos.
- Casca: `src/navigation/opcoesCasca.ts` → `.tsx` com `temaNavegacao` (DarkTheme com `background: fundo`, sem flash branco), header escuro, `useOpcoesTabBar()` (altura 56 + `insets.bottom`, rótulo Oswald) e `iconeAba()` (traço de 2px em acento na aba ativa).
- Assets: `icon.png`, `android-icon-foreground/background/monochrome.png`, `splash-icon.png` e `favicon.png` gerados a partir de `assets/roundup_logo_invertida.png` sobre `#0B0B0C` (script temporário com Playwright + canvas, fora do repo, sem dependência nova). `app.json`: `userInterfaceStyle: "dark"`, `backgroundColor: "#0B0B0C"`, adaptive icon com fundo `#0B0B0C`, plugin `expo-splash-screen` configurado (`backgroundColor`, `image`, `imageWidth: 200`).
- `docs/DESIGN.md` criado; nota de substituição no topo de `DESIGN_BRIEF.md`, `script.md` e `docs/AUDITORIA_UI.md`.
