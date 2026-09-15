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
