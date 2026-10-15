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

## Fase 2 — Componentes base

Validados na Galeria (`docs/redesign/fase-2/`, incluindo `*-modal-folha|dialogo|aviso.png`).

**Refeitos**
- `Botao`: `primario` em acento (texto `#0B0B0C`), `secundario` (contorno `linhaForte`), `fantasma`, `destrutivo` (perigo), `texto` (link), **`voltar`** (novo: seta + "Voltar", alinhado à esquerda — substitui o "‹ Voltar" centralizado). Rótulo Oswald caixa alta, raio 2, `grande` (56px) e `icone`. Pressionado = escala 0.97 (desligada com reduce motion). Foco de teclado = anel de 2px em acento (`useFocoVisivel`, só `:focus-visible` no web). Desabilitado = superficie2 + texto3, não opacidade.
- `CampoTexto`: fundo superficie1, sublinhado `linhaForte` (3,6:1) → acento 2px no foco / perigo no erro; rótulo é o nome acessível do input; erro com `accessibilityLiveRegion`; mostrar/ocultar senha; `mascara="data|hora"` com number-pad; `ajuda`; `onSubmitEditing`/`returnKeyType`/`autoComplete` repassados.
- `Etiqueta`: único chip do app (pílula). Estática (superficie1), seleção única (role radio) e múltipla (role checkbox); selecionada = preenchida em `texto`.
- `ModalitySelector`: sem estilo próprio — Etiqueta (múltipla) + CampoTexto para "Outra".
- `Abas`: rótulos Oswald caixa alta, sublinhado de 2px na ativa.
- `Dialogo`: superficie2, canto vivo, filete superior (perigo quando destrutivo), `carregando` no confirmar.
- `Folha`: alça, título, botão fechar, `KeyboardAvoidingView` + rolagem interna, inset inferior, maxWidth 720.
- `Aviso`: variantes `sucesso|erro|info` com filete e ícone; fixo na viewport via `<Tela sobreposicao>`; entrada animada (reduce motion respeitado).
- `Esqueleto`: superficie2, `forma="linha"` (imita linha de lista), reduce motion.
- `EstadoVazio` / `EstadoErro`: ícone SVG em 64px + CTA; `EstadoErro compacto` para erro dentro de seção.
- `LinhaFina`: linha simples em `linha`; `corda` = linha dupla para divisor de seção.
- `Cartao`: superficie1, sem borda, raio 4; `corFilete`; `corteDiagonal` com corte fixo em px (28, até 40% da altura) medido por onLayout — em % ficava invisível em cards largos.
- `Avatar`: superficie2 + contorno, iniciais em Oswald.
- `TexturaLona`: id do pattern único (`useId`) e acessibilidade num View envoltório (`aria-hidden`) — **o warning "React does not recognize the prop" do console sumiu** (adiantado da fase 5).

**Novos**: `Toggle` (Switch real, role switch, linha inteira tocável), `Checkbox` (com ✓), `CabecalhoSecao`, `ItemMenu`, `Estatistica`, `BandaIdentidade` (`aluno|gestor`, `compacta`, `sobHeader`, textura + marca d'água, inset superior), hooks `useMovimentoReduzido` e `useFocoVisivel`. Ícones novos: Voltar, Chevron, Fechar, Mais, Olho, OlhoFechado, Alerta, Relógio, Chama, Cinturão, Sair.

**Trocas nas telas**
- `TextInput` cru → `CampoTexto`: `RegistrarGraduacaoScreen`, `RelatorioFrequenciaScreen` (com máscara de data), `MissoesGestorScreen`, `ModalitySelector`. Nenhum `TextInput` fora do `CampoTexto` no projeto.
- Toggles improvisados: atuação do `CadastroProfessorScreen` → `Abas`; `PreferenciasNotificacaoScreen` → `Toggle`; Ativa/Inativa de `MissoesGestorScreen` → `Toggle`; aceite do `ConsentimentoLGPDScreen` → `Checkbox`.
- `MissoesGestorScreen`, `RegistrarGraduacaoScreen`, `RelatorioFrequenciaScreen` e `PreferenciasNotificacaoScreen` já migradas para `Tela`/`Texto` (adiantado da fase 4), com erros via `mensagemErro`.
- `utils/mensagensErro.ts`: nova `mensagemErro(erro, padrao)` — traduz códigos do Firebase e preserva mensagens de negócio dos services (`throw new Error('...')` em PT).
- `AuthStack` e `AlunoRaiz` passam a usar `opcoesHeader` (header da Galeria e de "Vincular-se" estava no estilo padrão).
- Galeria reescrita: tipografia, paleta, ícones, todos os componentes base e de domínio.

## Fase 3 — Componentes de domínio

Screenshots em `docs/redesign/fase-3/`, incluindo as composições (`*-comp-home|perfil|classificacao|hoje.png`, e `mobile-comp-*-inteira.png` com a tela inteira) e `*-modal-celebracao.png`.

- **Dependência**: `expo-haptics ~57.0.3` (`npx expo install`). Wrapper `src/utils/haptica.ts` (impacto, sucesso, seleção; nunca lança erro).
- **`HeroCheckIn`** (novo): card do próximo treino com corte diagonal + lona, horário em `placarGrande`, rótulo do dia, turma e professor; área única de 56px, largura total, com os 3 estados — disponível (CTA em acento "Fazer check-in"), fora da janela (placa tracejada com cadeado e **contagem regressiva** "Abre em 25 min", atualizada a cada 15 s, ou "Check-in encerrado"), feito (placa verde "Treino registrado"). Filete superior muda de cor por estado. Punch + flash + haptic na transição para "feito"; reduce motion respeitado.
- **`BotaoCheckIn`**: versão compacta para linhas — disponível contornado (o acento fica só no hero), fora da janela em `texto2` (estado, não erro), feito em verde; punch + haptic, reduce motion respeitado.
- **`CartaoSessao`**: sem o ícone de estado duplicado; bloco de horário em placar à esquerda quando recebe `inicio`.
- **`BarraProgresso`**: 10 segmentos "por round"; vazio = traço `linhaForte` (3,9:1), cheio = bloco em acento (diferença de forma, não só de cor); rótulo "NÍVEL" + placar; XP em contador animado; "Faltam N XP para o nível N+1"; estado "Nível máximo". Preenchimento animado. Novo hook `useNumeroAnimado`.
- **`SeloFaixa`**: faixa de tecido em SVG. `interpretarFaixa()` lê o texto livre (branca, cinza, amarela, laranja, verde, azul, roxa/lilás, marrom, vermelha, preta; graus por "2º grau", "grau 2", "3 dan", "kyu"), desenha a cor, a ponteira (preta; vermelha na faixa preta) e até 6 tarjas. Não reconhecido → faixa neutra, texto original sempre visível. `tamanho="grande"` para o card de faixa. Prop `sobreEscuro` removida.
- **`Medalha`**: emblema em SVG (placa de fivela de cinturão com correias), ícone por tipo (luva = treinos, chama = sequência, faixa = graduação), número em Oswald; bloqueada = contorno tracejado; `maxima` = única em ouro.
- **`Podio`**: blocos com alturas 104/76/56 (1º/2º/3º), posição em `placarGrande` dentro do bloco, 1º em ouro com ícone de cinturão; coluna do aluno com traço de acento.
- **`LinhaClassificacao`**: linha do aluno com fundo `superficie1`, barra lateral de 3px em acento e rótulo "Você".
- **`CartaoMissao`**: virou linha (sem card) com barra segmentada por unidade da meta (≤10) e placar "2/3"; concluída em verde.
- **`IndicadorSequencia`** (chama + placar animado), **`IndicadorFrequencia`** (bloco = presença, traço = falta), **`CartaoAluno`** (alerta com ícone), **`CelebracaoGraduacao`** (escuro, faixa grande, título display com sombra dura em acento, haptic, reduce motion).
- `src/utils/apresentacao.ts` (novo): `formatarHora`, `rotuloDia` ("Hoje", "Amanhã", "Qui 17/10"), `formatarDiaHora`, `formatarDuracao`, rótulos humanizados de status de sessão ("Aberta agora"), nível de turma ("Intermediário") e status de check-in.
- **Visões de apresentação** (novas, usadas pelas telas reais na fase 4 e pela Galeria): `aluno/HomeAlunoVisao.tsx`, `aluno/PerfilAlunoVisao.tsx`, `aluno/ClassificacaoVisao.tsx`, `professor/HojeProfessorVisao.tsx`.
- **Galeria → "Composições"**: as 4 visões montadas com dados fictícios (`src/screens/dev/composicoes.tsx`), cada uma abrindo em tela inteira. Seções novas: HeroCheckIn (3 estados), linhas de sessão, progresso, missões, medalhas, faixas interpretadas, classificação, gestor.
- Ajustes de revisão visual: chip estático em `superficie2` (sumia sobre a banda); coluna de horário com rótulo do dia em 1 linha.

## Fase 4 — Telas

Screenshots em `docs/redesign/fase-4/` (auth em 3 viewports + Galeria + composições). Telas autenticadas validadas pelas composições da Galeria (Home, Perfil, Classificação, Hoje do Professor); as demais, por `tsc` e leitura — não há como renderizá-las sem login (ver `docs/REDESIGN_RESULTADO.md`).

**Regras aplicadas em todas as telas**: raiz `<Tela>` (safe area, maxWidth 480/720), tipografia só via `<Texto>`/componentes (grep sem `fontSize`/`fontWeight`/`fontFamily` em `src/screens`, fora a Galeria), listas sem card com borda, nenhum metadado unido por ponto médio, enums humanizados (`utils/apresentacao.ts`), **zero `setErro(e.message)`** (todas via `mensagemErro`), `EstadoErro` com "Tentar novamente" nos dashboards e na Agenda, ações com proteção contra toque duplo.

**Auth**: Login em tela cheia escura (logo invertido, tagline display em 2 linhas com sombra dura em acento, CTA "Entrar" grande, Enter no e-mail vai para a senha e na senha envia, `autoComplete`), Recuperar senha (confirmação com filete de sucesso), Seleção de perfil ("Quem entra no ringue?", opções com ícone em círculo + chevron, Aluno primeiro), LGPD (política rolável, Checkbox, ajuda quando o botão está desabilitado), Cadastros (seções "Conta" / "Ficha de atleta"/"Ficha técnica"/"Academia", senha com ajuda e mostrar/ocultar, data com máscara, prévia da faixa enquanto digita, responsável legal com filete). `MensagemErro` (novo) para erro de envio.

**Aluno**
- Home → `HomeAlunoVisao`: banda compacta → HeroCheckIn → progresso (XP + sequência) → próximos treinos → atalhos (Turmas disponíveis, Histórico) como ItemMenu. Erro de check-in vira Aviso (não esconde o hero).
- Agenda: agrupada por dia ("Hoje", "Amanhã", "Qui 17/10"), linhas com bloco de horário, erro com retry, Aviso no erro de check-in.
- Missões: `Abas` "Em curso (n)" / "Concluídas (n)", vazios específicos por aba.
- Classificação → `ClassificacaoVisao` (pódio, "sua posição", lista); vazio com CTA "Ver agenda".
- Histórico: resumo em Estatistica + linhas com status por ícone e texto.
- Turmas disponíveis: linhas com chips de modalidade/nível, "Matricular" contornado, ✓ "Matriculado", Aviso de sucesso.
- Vincular-se: busca local por nome/endereço (sem nova consulta), loading por item, "Enviado", Aviso de sucesso.
- Bloqueio de vínculo: tela cheia com marca, "Escolha seu corner", CTA em acento.
- Perfil → `PerfilAlunoVisao`; "Excluir conta" saiu da tela principal.

**Professor/Academia**: Hoje do professor → `HojeProfessorVisao`; Hoje da academia com banda de gestor, contadores em Oswald (Estatistica) e lista de professores; Perfis com card de faixa (professor), ItemMenu de Gestão e Conta; Visão consolidada com Estatistica e barra de frequência; Turmas com **lista primeiro e "+ Nova turma" em Folha**; Turma (detalhe) com "+ Nova sessão" em Folha (campo "Semana de referência" explicado), sessões com horário em placar e status humanizado; Sessão com a **ação principal em botão primário** ("Abrir check-in"/"Encerrar sessão"); Alunos; Solicitações (Recusar/Aceitar abaixo do nome, "Encerrar" vínculo com diálogo).

**Compartilhado**: nova `ContaPrivacidadeScreen` ("Conta e privacidade": e-mail, privacidade, zona de risco com "Excluir minha conta") registrada nos 3 stacks de Perfil; `ExcluirContaSecao` removida. `EditarPerfil` com prévia da faixa e erros traduzidos. `TelaEmBreve` e `LoadingScreen` no tema.
