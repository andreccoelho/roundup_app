# RoundUp — Design (direção Apple)

**Fonte única de decisões visuais.** Substitui a direção "Noite de luta" (`docs/historico/DESIGN_noite_de_luta.md`). Tokens em `src/theme/tokens.ts`; tema em `src/theme/tema.tsx`. Resultado e decisões do redesign: `docs/REDESIGN_APPLE_RESULTADO.md`. Contraste: `docs/redesign-apple/contraste.md`.

Conceito: o RoundUp com cara de app nativo moderno da Apple, seguindo as Human Interface Guidelines do iOS, como os apps Saúde, Fitness e Atividade: limpo, leve, com o vermelho da marca como cor de destaque (como o rosa no Fitness).

## Tema
- **Claro e escuro, seguindo o aparelho** (`useColorScheme`; no web, `prefers-color-scheme`). `app.json` → `"userInterfaceStyle": "automatic"`. `expo-system-ui` sincroniza o fundo da view nativa raiz com o tema (`App.tsx`). Status bar em `auto`.
- Componentes nunca importam uma paleta: usam `useTema().cores` e `criarEstilos((c, escuro) => ({...}))`, que cria um StyleSheet por tema e devolve o do tema atual.
- A Galeria (só `__DEV__`) tem um seletor Sistema/Claro/Escuro (`forcarEsquema`).

## Paleta (cores semânticas por tema, modelo das cores de sistema do iOS)

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `fundo` | `#FFFFFF` | `#000000` | systemBackground |
| `fundoAgrupado` | `#F2F2F7` | `#000000` | systemGroupedBackground — fundo de quase todas as telas |
| `superficie` | `#FFFFFF` | `#1C1C1E` | secondarySystemGroupedBackground — células, cartões |
| `superficieElevada` | `#FFFFFF` | `#2C2C2E` | sheet, alerta, toast, conquista |
| `texto` | `#000000` | `#FFFFFF` | label |
| `texto2` | `#56565C` | `#AEAEB2` | secondaryLabel (ajustado para 4,5:1) |
| `texto3` | `#6A6A70` | `#98989F` | tertiaryLabel (ajustado), placeholder, chevron |
| `separador` | `rgba(60,60,67,0.29)` | `rgba(84,84,88,0.65)` | separator, hairline |
| `preenchimento` | `rgba(120,120,128,0.12)` | `rgba(120,120,128,0.32)` | fill — campos, botão cinza, trilhas |
| `preenchimentoOpaco` | `#E5E5EA` | `#3A3A3C` | avatar (não soma camadas) |
| `tint` | `#CC2A1F` | `#FF5A4F` | vermelho da marca como texto, ícone e controle |
| `tintCheio` | `#CC2A1F` | `#CC2A1F` | fundo de botão cheio, chip selecionado, trilha do switch |
| `tintSuave` | 8% do tint | 16% do tint | destaque leve (linha do próprio usuário, erro de formulário) |
| `sucesso` / `sucessoCheio` | `#177A34` / `#1A7F37` | `#30D158` / `#1A7F37` | presença, check-in feito |
| `perigo` / `perigoCheio` | `#C4231B` / `#C4231B` | `#FF6961` / `#C4231B` | erro, ação destrutiva |
| `ouro` | `#876000` | `#FFD60A` | só 1º lugar e medalha máxima |
| `controleSelecionado` | `#FFFFFF` | `#636366` | segmento ativo |

Regras:
- **Tint** é o único acento: botões principais, aba ativa, links, toggles, ícones de lista. Verde e ouro são só funcionais.
- Rótulo sobre `tintCheio`, `perigoCheio` e `sucessoCheio` é sempre branco (5,1 a 5,8:1).
- Anel de foco de teclado (web): `CorFoco` `#CC2A1F`, 2px, afastado 2px (5,4:1 no claro, 3,9:1 no escuro).
- Cores de faixa (`CoresFaixa`) são dado de domínio e só aparecem no `SeloFaixa`.

## Tipografia — fonte do sistema, sempre via `<Texto variante>`

| Variante | Tamanho / linha / peso | Uso |
|---|---|---|
| `largeTitle` | 34/41, bold | título grande da tela |
| `title1` | 28/34, bold | título de tela empilhada (detalhe) |
| `title2` | 22/28, bold | nome no perfil, título de conquista |
| `title3` | 20/25, semibold | cabeçalho de bloco ("Progresso", "Medalhas"), saudação |
| `headline` | 17/22, semibold | ênfase, botão |
| `body` | 17/22 | texto corrido, linhas de lista |
| `callout` | 16/21 | — |
| `subheadline` | 15/20 | metadados, descrição |
| `footnote` | 13/18 | cabeçalho e rodapé de lista agrupada, ajuda |
| `caption` | 12/16 | rótulos mínimos |
| `numero` / `numeroGrande` / `numeroXL` | 22 bold / 34 heavy / 64 heavy, `tabular-nums` | XP, nível, posição, horário, contadores |
| `marca` | Homebase 32 | só wordmark |

- **SF Pro no iOS, Roboto no Android, pilha do sistema no web** (Segoe UI no Windows). A Oswald saiu do app; a Homebase fica no logo, no splash e no wordmark.
- **Dynamic Type**: `allowFontScaling` ativo em todo texto; teto (`maxFontSizeMultiplier`) só em Large Title (1,6×), números (1,2× a 1,6×) e na marca (1,3×).
- Sem caixa alta. Títulos entram como `header` na árvore de acessibilidade.

## Forma
- **Cantos contínuos** (`borderCurve: 'continuous'`): 10 em campos (`Raios.campo`), 12 em listas e cartões (`Raios.lista`), 16 em cartões de destaque e sheets (`Raios.destaque`), cápsula em botões e chips.
- **Listas agrupadas inseridas** (`GrupoLista` + `LinhaLista`) como padrão: cabeçalho em Footnote, linhas de no mínimo 44pt, separador hairline recuado até o texto, chevron à direita quando navega, rodapé explicativo.
- **Cartões de destaque** (`Cartao destaque`) só onde há um dado principal: check-in do dia, progresso de nível, posição na classificação, sessão do dia, contadores da academia. Sem borda; sombra muito sutil só no claro.
- Saíram: textura de lona, corte diagonal, bandas de identidade com marca d'água, sombras duras, cantos vivos.

## Materiais e navegação
- **iOS**: cabeçalho transparente com material translúcido (`headerBlurEffect: 'systemChromeMaterial'`) e **Large Title** nas raízes das abas, que encolhe ao rolar (`contentInsetAdjustmentBehavior` na `Tela`).
- **Android e web**: cabeçalho sólido no fundo agrupado (título Headline, voltar em tint); nas raízes das abas o cabeçalho some e a `Tela` desenha o título grande (`tituloGrande`).
- **Tab bar translúcida** (`expo-blur`) no iOS e no web; sólida no Android e com "Reduzir transparência" ligado. Ícone ativo preenchido em tint, inativo em contorno `texto3`.
- **Ícones**: SVG próprio no estilo SF Symbols (traço 1,75, pontas e junções arredondadas, versão preenchida para aba ativa), igual nas três plataformas. Sem `expo-symbols`.
- **Fluxos curtos como sheet**: editar perfil, notificações, registrar graduação e pontuação (`presentation: 'modal'` = pageSheet no iOS), com "Cancelar" à esquerda e "Salvar"/"Registrar" à direita; notificações salvam a cada toque e só têm "OK". Criar turma, sessão e missão usam a `Folha` (pageSheet nativo no iOS; sheet desenhado no Android/web) com "Cancelar" e "Criar" na barra.
- **Confirmações**: `Dialogo` vira `Alert.alert` nativo no iOS e no Android (botão destrutivo em vermelho); no web, o mesmo desenho do alerta do iOS.

## Componentes (resumo)
- **Base**: Botao (cheio, cinza, simples, destrutivo, link, voltar; cápsula; pressionado = opacidade 0,7), CampoTexto (preenchido, rótulo sempre visível, borda de 2px no foco/erro), GrupoLista, LinhaLista, ItemMenu, Toggle, Abas (segmentado), Etiqueta (chip), Checkbox (círculo), Folha, Dialogo, Aviso (toast), EstadoVazio/EstadoErro (ícone em texto3, Title 3, uma linha, botão), Esqueleto, Cartao, Estatistica, Avatar, MensagemErro, CabecalhoSecao, CabecalhoPerfil, BotaoCabecalho, Logo.
- **Domínio**: HeroCheckIn (cartão de destaque, botão cápsula de 50pt), AnelProgresso (anel de Atividade com o nível no centro), BarraProgresso (barra contínua), IndicadorSequencia (cartão compacto com chama), Medalha (emblema redondo; cinza translúcido com cadeado quando bloqueada; ouro só na máxima), Podio (três avatares com medalha de posição, sem blocos), LinhaClassificacao (linha do usuário em `tintSuave`), LinhaChamada (círculo de check), CartaoSessao, BotaoCheckIn, CartaoMissao, CartaoAluno, IndicadorFrequencia (pontos cheios × anéis), SeloFaixa, MomentoConquista e CelebracaoGraduacao (cartão central com emblema e "Continuar").

## Layout
- Toda tela usa `<Tela>`: fundo do tema, safe area, coluna centralizada; web/tablet só com `maxWidth` — **480** em formulários e **720** em listas. Gutter de 16.
- A tab bar fica sobre o conteúdo; a `Tela` soma a altura dela ao respiro inferior.

## Movimento e haptics
- `Animated` do RN com molas curtas (`Mola`: damping 18, stiffness 220), sem overshoot exagerado. Sem `react-native-reanimated`.
- Check-in confirmado: o ✓ cresce com mola + haptic de sucesso. Aviso entra com mola. Conquista: flash de tint na tela inteira, o cartão sobe de 92% para 100% com a mola, o emblema "estoura" de 60% para 100% com overshoot (`Easing.back`), dois halos de tint se expandem atrás dele e o haptic é duplo (impacto ao abrir, sucesso quando o emblema assenta). Efeitos herdados da direção anterior, no traço novo.
- Haptics (`expo-haptics`): seleção em toggles, abas, chips e checkbox; impacto leve ao fazer check-in e ao marcar presença; sucesso no check-in confirmado e na conquista; aviso em erro.
- **Reduce motion**: sem mola nem fade, estado final direto. **Reduce transparency**: tab bar sólida (o blur do cabeçalho nativo do iOS respeita a configuração sozinho).

## Imagens
- Sem fotos nem ilustrações externas. Estados vazios usam os ícones próprios em 56pt. Logo: versão escura no claro, invertida no escuro (`Logo`).
- Ícone do app, adaptive icon e splash: inalterados (logo invertido sobre `#0B0B0C`).

## Dependências
- Aprovadas e usadas: `expo-haptics`, `expo-system-ui`, `expo-blur`. Aprovada e não usada: `expo-symbols`.
- Removida: `@expo-google-fonts/oswald`.

## Dados
- Redesign só de apresentação: nenhuma mudança em serviços, tipos, regras ou testes. O `SeloFaixa` continua interpretando o texto livre de faixa (R-05).
