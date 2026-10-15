# RoundUp — Design ("Noite de luta")

**Fonte única de decisões visuais.** Substitui `DESIGN_BRIEF.md`, `script.md` e `docs/AUDITORIA_UI.md`, que ficam só como histórico. Diagnóstico de origem: `RELATORIO_UI_UX.md`. Tokens implementados em `src/theme/tokens.ts`.

Conceito: o app como o ringue numa noite de evento — base escura de arena, superfícies como lona sob o refletor, um único acento de **corner vermelho** para ação e destaque.

## Tema
- **Só escuro.** `app.json` → `"userInterfaceStyle": "dark"`, `"backgroundColor": "#0B0B0C"`. Não existe tema claro.
- Status bar sempre `light` (definida uma vez em `App.tsx`).

## Paleta

| Token | Valor | Uso |
|---|---|---|
| `fundo` | `#0B0B0C` | fundo de toda tela |
| `superficie1` | `#161618` | cards, inputs, linha destacada |
| `superficie2` | `#222225` | folha, diálogo, estado pressionado |
| `linha` | `#2C2C30` | separadores (decorativo) |
| `linhaForte` | `#6E6E74` | borda de input, contornos de UI (≥3:1) |
| `texto` | `#F4F2EE` | texto principal |
| `texto2` | `#A8A6A1` | texto secundário |
| `texto3` | `#8A8884` | terciário, placeholder |
| `acento` | `#F03A2E` | CTA principal + 1 destaque por tela |
| `sucesso` | `#2FB457` | check-in feito, presença |
| `perigo` | `#E5322D` | erro, ação destrutiva |
| `ouro` | `#D4A72C` | só 1º lugar do ranking e medalha de nível máximo |
| `sobreCor` | `#0B0B0C` | texto/ícone sobre acento, sucesso, perigo, ouro |
| `overlay` | `rgba(0,0,0,0.72)` | fundo de diálogo/folha/conquista |
| `foco` | = `acento` | anel/realce de foco |

Regras:
- **Acento**: no máximo 1-2 usos por tela (CTA principal + um destaque). Texto sobre botão de acento sempre `#0B0B0C`.
- **Ouro**: só 1º lugar do ranking e medalha de nível máximo.
- `sucesso`/`perigo` são só funcionais.
- Texto em `perigo` só sobre `fundo` (4,5:1); sobre superfícies cai abaixo de 4,5. `texto3` nunca sobre `superficie2`.
- Cores de faixa (`CoresFaixa`) são dado de domínio e só aparecem no `SeloFaixa`.

## Tipografia — sempre via `<Texto variante>` (`src/components/ui/Texto.tsx`)

| Variante | Família | Tamanho / linha | Uso |
|---|---|---|---|
| `display` | Homebase (caixa alta nativa) | 32/36, ls 1 | título de tela/hero, wordmark |
| `titulo` | sistema 700 | 20/26 | título de bloco, diálogo, folha |
| `secao` | Oswald 600, CAIXA ALTA | 14/18, ls 1.5 | cabeçalho de seção |
| `corpo` / `corpoForte` | sistema 400 / 600 | 16/22 | texto corrido, listas, nomes |
| `legenda` | sistema 400 | 14/20 | metadados, ajuda |
| `rotuloPlacar` | Oswald 600, CAIXA ALTA | 12/16, ls 1.5 | "NÍVEL", "XP", "SEQUÊNCIA" |
| `placar` | Oswald 700, tabular | 24/28 | números de lista/estatística |
| `placarGrande` | Oswald 700, tabular | 48/52 | hero (horário, XP) |
| `placarXL` | Oswald 700, tabular | 96/100 | momento de conquista |

- **Caixa alta** liberada só em títulos Homebase e rótulos de placar Oswald (12-14px, letterSpacing 1.5).
- **Números** (XP, nível, posição, contadores, horário do hero) sempre em Oswald.
- **Sombra dura**: removida dos títulos. Permitida só em título `display` de hero/conquista, na cor do acento, offset 2/2 (`Sombras.duraAcento`).
- Títulos (`display`, `titulo`, `secao`) recebem `accessibilityRole="header"` automaticamente.
- Nenhum metadado unido por ponto médio: separar por peso/tamanho/linha.

## Forma
- **Cantos vivos**: raio 2-4 (`Raios.vivo`, `Raios.pequeno`) em botões, inputs e cards. Pílula (`Raios.pilula`) só em chips.
- **Corte diagonal** (`Geometria.corteDiagonal`): no máximo uma vez por tela — hero de check-in e card de faixa.
- **Listas sem card com borda**: linhas sobre o fundo, separadas por `linha` (`LinhaFina`). A linha do próprio usuário ganha barra lateral de 3px em acento.
- Sem sombra suave. Profundidade = superfícies (`fundo` → `superficie1` → `superficie2`) + overlay.

## Componentes (resumo)
- **Botao**: `primario` (acento, texto `sobreCor`), `secundario` (contorno `linhaForte`), `fantasma`, `destrutivo` (perigo), `texto`, `voltar` (alinhado à esquerda, com ícone). Pressed = escala 0.97. Foco visível no web.
- **CampoTexto**: fundo `superficie1`, sublinhado `linhaForte`, foco em acento 2px, label acessível, erro em live region, mostrar/ocultar senha, máscara opcional de data/hora.
- **Toggle**, **Checkbox**, **Abas**, **Etiqueta** (chip, único raio), **Dialogo**, **Folha**, **Aviso** (sucesso/erro/info, fixo na viewport), **EstadoVazio/EstadoErro** (ícone 64px + CTA), **CabecalhoSecao**, **ItemMenu**, **Estatistica**, **BandaIdentidade** (aluno/gestor).
- Domínio: **HeroCheckIn**, **BarraProgresso** (segmentos por round, trilha ≥3:1), **SeloFaixa** (faixa de tecido SVG), **Medalha** (emblema SVG), **Podio** (blocos com alturas), **LinhaClassificacao**, **MomentoConquista**.

## Layout
- Toda tela usa `<Tela>` (`src/components/ui/Tela.tsx`): fundo, safe area, coluna centralizada.
- Web/tablet: só containers com `maxWidth` — **480** em auth/formulários, **720** em listas — centralizados. Sem 2 colunas nem rail lateral por enquanto.
- Gutter lateral 16. Tab bar: altura 56 + `insets.bottom`; aba ativa com traço de 2px em acento.
- Telas de gestor seguem o mesmo visual escuro do aluno.

## Motion
- `Animated` do RN (sem reanimated). Haptics via `expo-haptics`.
- Check-in: punch (escala) + flash + haptic. Conquista: flash de acento + número entrando. Contador de XP e preenchimento de barra animados.
- **Tudo respeita reduce motion** (`AccessibilityInfo.isReduceMotionEnabled`): sem animação, estado final direto.

## Imagens
- Nenhuma foto ou ilustração externa. Estados vazios e conquistas usam os ícones SVG próprios em tamanho grande.
- Ícone do app, adaptive icon e splash: logo invertido sobre `#0B0B0C`.

## Dependências
- Aprovada: `expo-haptics`.
- Não usar: `react-native-reanimated`, `expo-linear-gradient`, `@react-native-community/datetimepicker`. Gradiente, se preciso, via `react-native-svg`.

## Dados
- Redesign só de apresentação. O `SeloFaixa` interpreta o texto livre atual de faixa (ex.: "roxa", "azul", "preta", "2º grau"); não há mudança de modelo nem de Firestore.
