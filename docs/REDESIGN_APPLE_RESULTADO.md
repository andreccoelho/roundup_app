# Redesign Apple — Resultado

Branch `feat/ui-apple` (a partir da `dev`), um commit por fase:

| Fase | Conteúdo |
|---|---|
| 1. Tokens e tema | Paleta semântica clara/escura no modelo das cores de sistema do iOS, `ProvedorTema`/`useTema`/`criarEstilos`, `Texto` com a escala do iOS, Oswald removida, `userInterfaceStyle: automatic`, `expo-system-ui` |
| 2. Componentes base | Botões do iOS, campos preenchidos, `GrupoLista`/`LinhaLista`, Toggle, controle segmentado, Folha como sheet, Dialogo como alerta do sistema, Aviso, estados vazio/erro |
| 3. Casca de navegação | Large Title com material translúcido (iOS), título grande desenhado pela Tela (Android/web), tab bar translúcida (`expo-blur`), ícones SVG no estilo SF Symbols, fluxos curtos como sheet, `CascaDemo` na Galeria |
| 4. Componentes de domínio | HeroCheckIn, AnelProgresso, sequência, medalhas, pódio leve, LinhaClassificacao, LinhaChamada, linhas de sessão/missão/aluno, conquista em cartão central |
| 5. Telas | Todas as telas migradas (aluno, gestor, autenticação); BandaIdentidade e TexturaLona removidas |
| 6. Polimento | Ponte de tokens antigos removida, axe-core sem violações nos dois temas, contraste documentado, capturas em 375/768/1440, documentação |

Referência de design: `docs/DESIGN.md` (a anterior está em `docs/historico/DESIGN_noite_de_luta.md`). Contraste: `docs/redesign-apple/contraste.md`. Capturas por fase: `docs/redesign-apple/fase-N/`. Capturas para o relatório do TCC: `docs/redesign-apple/relatorio/`.

**Verificação**: `npx tsc --noEmit` limpo e `npm run test:unit` (34/34) ao fim de cada fase; `npm run test:rules` (106/106) e `npm run test:functions` (29/29) passando no fim (nenhum serviço, tipo, regra ou teste foi alterado). axe-core (WCAG 2.1 A/AA) com **0 violações** em 9 telas × 2 temas (`docs/redesign-apple/fase-6/axe.json`). Console do web sem erros. Capturas feitas com o Firebase bloqueado no navegador, a partir de um bundle web de desenvolvimento (`expo export --dev`), sem login nem escrita no Firebase.

---

## Antes / depois

"Antes" = fim da direção "Noite de luta" (`docs/redesign/fase-5/`); "depois" = `docs/redesign-apple/fase-6/` (salvo indicação).

| Tela | Antes | Depois (claro / escuro) |
|---|---|---|
| Login (375) | `redesign/fase-5/mobile-01-login.png` | `mobile-claro-login.png` / `mobile-escuro-login.png` |
| Login (1440) | `redesign/fase-5/desktop-01-login.png` | `desktop-claro-login.png` / `desktop-escuro-login.png` |
| Seleção de perfil | `redesign/fase-5/mobile-03-selecao-perfil.png` | `redesign-apple/fase-5/mobile-claro-02-selecao-perfil.png` / `mobile-escuro-02-…` |
| Consentimento LGPD | `redesign/fase-5/mobile-04-consentimento.png` | `redesign-apple/fase-5/mobile-claro-03-lgpd.png` / `mobile-escuro-03-…` |
| Cadastro do aluno | `redesign/fase-5/mobile-05-cadastro-aluno.png` | `redesign-apple/fase-5/mobile-claro-04-cadastro-aluno.png` / `mobile-escuro-04-…` |
| Home do aluno | `redesign/fase-5/mobile-comp-home-inteira.png` | `mobile-claro-home.png` / `mobile-escuro-home.png` (inteira: `redesign-apple/fase-5/mobile-*-06-home-inteira.png`) |
| Perfil do aluno | `redesign/fase-5/mobile-comp-perfil-inteira.png` | `mobile-claro-perfil.png` / `mobile-escuro-perfil.png` (inteira: `fase-5/mobile-*-07-perfil-inteira.png`) |
| Classificação | `redesign/fase-5/mobile-comp-classificacao-inteira.png` | `mobile-claro-classificacao.png` / `mobile-escuro-classificacao.png` |
| Hoje do professor (chamada) | `redesign/fase-5/mobile-comp-hoje-inteira.png` | `mobile-claro-hoje.png` / `mobile-escuro-hoje.png` |
| Conquista | `redesign/fase-5/desktop-modal-conquista-nivel.png` | `redesign-apple/fase-4/mobile-claro-conquista-nivel.png` / `mobile-escuro-…` |
| Sheet (nova missão) | `redesign/fase-5/desktop-modal-folha.png` | `redesign-apple/fase-2/mobile-claro-folha.png` / `mobile-escuro-folha.png` |
| Alerta de confirmação | `redesign/fase-2/mobile-modal-dialogo.png` | `redesign-apple/fase-2/mobile-claro-dialogo.png` |
| Componentes (botões, campos, listas, toggles) | `redesign/fase-5/mobile-galeria-*.png` | `redesign-apple/fase-2/mobile-*-{botoes,campos,listas,toggles}.png` |
| Domínio (check-in, progresso, medalhas, ranking, chamada) | `redesign/fase-3/` | `redesign-apple/fase-4/mobile-*-{hero,progresso,medalhas,classificacao,chamada}.png` |
| Tablet (768) | — | `tablet-{claro,escuro}-*.png` |
| Foco por teclado | `redesign/fase-5/mobile-foco-*.png` | `mobile-claro-foco-01..04.png` |
| Para o relatório (claro, 375, sem cabeçalho de dev) | — | `relatorio/tela-login.png`, `tela-aluno-inicio.png`, `tela-aluno-classificacao.png`, `tela-professor-chamada.png` |

As telas autenticadas aparecem pelas **Composições** da Galeria: são as visões reais (`HomeAlunoVisao`, `PerfilAlunoVisao`, `ClassificacaoVisao`, `HojeProfessorVisao`) com dados fictícios, agora dentro da casca real de navegação (`CascaDemo`: mesma tab bar, cabeçalho e título grande das raízes de verdade).

---

## Decisões tomadas por conta própria

1. **Tema por hook, não por constante.** O tema anterior era uma constante importada em 57 arquivos dentro de `StyleSheet.create`, o que não troca em tempo de execução. Criei `useTema()` e `criarEstilos()` (um StyleSheet por tema, criado uma vez). Para manter `tsc` limpo entre as fases, os nomes antigos ficaram numa ponte temporária (`theme/legado.ts`, valores do tema escuro), removida na fase 6.
2. **Dois tons de tint.** O `#F03A2E` dá 3,9:1 sobre branco, e branco sobre o `systemRed` escuro dá ~3,5:1. Por isso `tint` (texto/ícone: `#CC2A1F` claro, `#FF5A4F` escuro) e `tintCheio` (`#CC2A1F` nos dois temas, rótulo branco a 5,4:1). O vermelho do botão é o mesmo nos dois temas.
3. **Cinzas de texto mais escuros que os do iOS** no tema claro (`secondaryLabel` dá 3,4:1). Visualmente quase iguais, mas passam 4,5:1.
4. **Destrutivo cheio** usa um vermelho fixo (`perigoCheio`) para o rótulo branco passar contraste no escuro.
5. **Ícones em SVG próprio** no estilo SF Symbols, sem `expo-symbols` (combinado na aprovação do plano): o visual é o mesmo no web, onde as capturas do relatório são feitas.
6. **Anel de progresso, não barra**, para o nível: é a forma consagrada pelo Fitness e deixa o nível em destaque no centro. A barra contínua ficou nas missões.
7. **Pódio mantido, mais leve**: três avatares (o 1º maior e mais alto) com uma medalha de posição; ouro só no 1º. Sem blocos.
8. **Sheets com `presentation: 'modal'`, sem detents.** `formSheet` com detents e cabeçalho próprio tem comportamento instável no react-native-screens; o pageSheet de `modal` é o padrão do iOS para formulários e tem o cabeçalho com Cancelar/Salvar. A `Folha` (criar turma/sessão/missão) virou `Modal presentationStyle="pageSheet"` no iOS.
9. **Título grande fora do iOS**: `headerLargeTitle` só existe no iOS. No Android e no web, nas raízes das abas o cabeçalho some e a `Tela` desenha o Large Title, para o desenho ser o mesmo nas capturas.
10. **Campos sem borda de 3:1.** O padrão do iOS (campo preenchido) não tem contorno; quem identifica o campo é o rótulo, sempre visível acima. Foco e erro ganham borda de 2px em tint/perigo. Era 3:1 de sublinhado na direção anterior.
11. **Switch desenhado no web.** No web o `Switch` vira um `<input>` focável dentro da linha (que já é o switch acessível) e o axe acusa `nested-interactive`; lá o interruptor é só desenho com as mesmas cores. No nativo é o Switch do sistema.
12. **Nome acessível = texto visível** nas linhas de lista (o axe acusava `label-content-name-mismatch` com o rótulo montado à mão).
13. **Avatar com fundo opaco** (`preenchimentoOpaco`): o fundo translúcido somava com o `tintSuave` da linha do usuário e derrubava o contraste das iniciais no escuro.
14. **Preferências de notificação com "OK"**, não "Cancelar": salvam a cada toque. A folha de conclusões de missão tem "Fechar" pelo mesmo motivo.
15. **"Encerrar sessão" pede confirmação** (alerta do sistema, botão destrutivo). Era o R-08; a chamada ao serviço é a mesma, só ganhou o passo de confirmação.
16. **Saudação no lugar da banda** na Home do aluno, no Hoje do professor e no painel da academia: avatar, "Olá, nome" e faixa. Perfis com cabeçalho centralizado (`CabecalhoPerfil`), como o cartão de conta do Ajustes.
17. **Contagens em cabeçalhos de lista** no formato "Título: N" (ex.: "Chamada: 5 matriculados"), sem ponto médio (regra herdada da direção anterior).
18. **Haptic de impacto passou de forte para leve** (check-in e chamada), mais próximo do padrão do iOS.
19. **Raiz "Treinar" e "Hoje" agora têm cabeçalho** (Large Title no iOS). A estrutura de navegação (telas e rotas) é a mesma; só a apresentação mudou.
20. **Fonte nas capturas**: no web do Windows a fonte do sistema é a Segoe UI, não a SF Pro. No iPhone o app usa a SF Pro.

---

## Ajustes depois da fase 6 (pedidos do autor)

- **MomentoConquista** com os efeitos da direção anterior: flash de tint, emblema que estoura com overshoot, halos e haptic duplo (`docs/redesign-apple/conquista/`).
- **Perfil do Professor** na Galeria: visão de apresentação separada (`PerfilProfessorVisao`), usada pela tela real e pela composição.
- **Fundo de identidade de volta**: lona de ringue e marca d'água do logo, agora em cartão de destaque (`FundoIdentidade`) e com cor por tema, no topo dos perfis, na saudação de Home/Hoje/painel da academia, no cartão de check-in e na conquista (`docs/redesign-apple/fundo/`).
- Acessibilidade revisada no cenário da conquista: indicadores de carregamento com nome, `aria-modal` inválido removido dos cartões de conquista e graduação, medalhas e pontos de frequência com papel de imagem. O único aviso restante do axe é de contraste nos botões da Galeria escurecidos atrás do fundo da conquista, que ficam inertes enquanto ela está aberta.

## O que ficou de fora e por quê

- **`expo-symbols`**: não usado, por decisão aprovada (ícones SVG próprios).
- **Detents nos sheets**: ver decisão 8.
- **`react-native-reanimated`**: não foi necessário; as molas com `Animated` ficaram boas.
- **Tela real de "Meus vínculos"**, **professor no hero da Home**, **medalha de graduação na detecção de conquistas**, **persistência das conquistas**: continuam exigindo consultas ou escritas novas no Firestore (R-06, R-07, R-09, R-10), fora de um trabalho de apresentação.
- **Faixa estruturada**: continua interpretada do texto livre (R-05).
- **Lint**: o projeto segue sem ESLint (R-01).
- **Telas autenticadas sem composição** (Agenda, Histórico, Missões, Turmas disponíveis, Vincular-se, Turmas, Turma e Sessão, Alunos, Solicitações, Missões do gestor, Relatório, Visão consolidada, Pontuação, Editar perfil, Notificações, Conta e privacidade): migradas com os mesmos componentes validados na Galeria e conferidas por `tsc`, mas **não vistas renderizadas**, porque exigem login. Recomendo uma conta de teste no emulador do Firebase para a próxima rodada.

---

## O que precisa de teste em dispositivo

O redesign foi visto só no web (react-native-web). Comportamentos implementados que só existem no nativo:

- **Large Title** encolhendo ao rolar e o **blur do cabeçalho** (`headerBlurEffect`), no iOS.
- **Tab bar com blur** (`expo-blur`, tint `systemChromeMaterial`) e a troca para sólida com "Reduzir transparência".
- **Sheets**: `presentation: 'modal'` (pageSheet) nas rotas e `Modal presentationStyle="pageSheet"` na `Folha`, com o gesto de arrastar para fechar; teclado nos formulários dentro do sheet.
- **Alertas nativos** (`Alert.alert`) no lugar do `Dialogo` desenhado, incluindo o botão destrutivo.
- **Haptics** em toggles, abas, chips, check-in, chamada, avisos e conquistas.
- **Dynamic Type** com fonte grande: quebras no cartão de check-in, no anel de progresso e nas linhas de classificação.
- **`expo-system-ui`**: fundo da raiz acompanhando o tema nas transições e na troca de aparência com o app aberto.
- **Status bar** em `auto` nos dois temas.
