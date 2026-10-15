# Redesign "Noite de luta" — Resultado

Branch `feat/ui-design-system`, 5 commits (um por fase):

| Fase | Commit | Conteúdo |
|---|---|---|
| 1. Fundação | `e519978` | tokens semânticos, `Texto`, `Tela`, safe area, casca escura, ícone/splash, `docs/DESIGN.md` |
| 2. Componentes base | `7292a26` | Botao, CampoTexto, Etiqueta, Abas, Dialogo, Folha, Aviso, estados; Toggle, Checkbox, CabecalhoSecao, ItemMenu, Estatistica, BandaIdentidade |
| 3. Domínio | `d8ca185` | HeroCheckIn, BarraProgresso, SeloFaixa, Medalha, Podio, LinhaClassificacao, visões das telas + Composições na Galeria, `expo-haptics` |
| 4. Telas | `5d55541` | todas as telas migradas, Conta e privacidade, gestor com lista primeiro, erros traduzidos |
| 5. Polimento | `cd008cc` | MomentoConquista, motion com reduce motion, passada de acessibilidade (axe: 0 violações) |

Referência de design: `docs/DESIGN.md`. Log por fase: `docs/REDESIGN_LOG.md`. Decisões tomadas pela opção conservadora: `docs/DECISOES_PENDENTES.md` (R-01 a R-10). Diagnóstico de origem: `RELATORIO_UI_UX.md`.

**Verificação**: `npx tsc --noEmit` limpo ao fim de cada fase; `npm run test:unit` 18/18; axe-core (WCAG 2.1 A/AA) sem violações nas 9 telas renderizáveis; console do web sem erros (resta só um aviso de depreciação emitido de dentro do `@react-navigation/bottom-tabs`). **Lint não existe no projeto** e não foi configurado (R-01). Nenhuma escrita, login ou conta no Firebase: todas as capturas foram feitas com as requisições ao Firebase bloqueadas no navegador.

---

## Antes / depois

Screenshots em `docs/redesign/`. "Antes" = análise original (`docs/redesign/antes/`); "depois" = estado final (`docs/redesign/fase-5/`, salvo indicação).

| Tela | Antes | Depois |
|---|---|---|
| Login (375) | `antes/mobile-01-login.png` | `fase-5/mobile-01-login.png` |
| Login com erros | `antes/mobile-02-login-erros.png` | `fase-5/mobile-02-login-erros.png` |
| Login (1440) | `antes/desktop-01-login.png` | `fase-5/desktop-01-login.png` |
| Título Homebase (zoom) | `antes/zoom-titulo.png` (ilegível) | `fase-5/mobile-03-selecao-perfil.png` |
| Seleção de perfil | `antes/mobile-05-selecao-perfil.png` | `fase-5/mobile-03-selecao-perfil.png` |
| Seleção de perfil (1440) | `antes/desktop-05-selecao-perfil.png` | `fase-5/desktop-03-selecao-perfil.png` |
| Consentimento LGPD | `antes/mobile-07-consentimento-aceito.png` | `fase-5/mobile-04-consentimento.png` |
| Cadastro do aluno com erros | `antes/mobile-09-cadastro-aluno-erros-alto.png` | `fase-5/mobile-06-cadastro-aluno-erros.png` |
| Componentes (check-in, sessão, barra, medalha) | `antes/gal-03.png` | `fase-5/mobile-galeria-*.png` (seções HeroCheckIn, linhas de sessão, progresso, medalhas) |
| Pódio / ranking | `antes/gal-04.png` | `fase-5/mobile-comp-classificacao-inteira.png` |
| Celebração | `antes/modal-celebracao.png` | `fase-5/mobile-modal-conquista-nivel.png`, `-faixa.png`, `-medalha.png` (aluno) e `fase-3/mobile-modal-celebracao.png` (professor) |
| Diálogo | `antes/modal-dialogo.png` | `fase-2/mobile-modal-dialogo.png` |
| Home do Aluno | não renderizável antes (exige login) | `fase-5/mobile-comp-home-inteira.png`, `desktop-comp-home.png` |
| Perfil do Aluno | não renderizável antes | `fase-5/mobile-comp-perfil-inteira.png` |
| Hoje do Professor | não renderizável antes | `fase-5/mobile-comp-hoje-inteira.png` |
| Foco por teclado | `antes/mobile-03-login-foco-tab3.png` (inputs sem indicador) | `fase-5/mobile-foco-01-email.png` … `-05-entrar.png` |
| Ícone do app | `assets/icon.png` era o "A" azul do Expo | `assets/icon.png` (logo invertido sobre `#0B0B0C`) |

As telas autenticadas (Home, Perfil, Classificação, Hoje do Professor) aparecem pelas **Composições** da Galeria: são as mesmas visões que as telas reais usam (`HomeAlunoVisao`, `PerfilAlunoVisao`, `ClassificacaoVisao`, `HojeProfessorVisao`), montadas com dados fictícios.

---

## O que foi feito, por item do relatório

Legenda: **Feito**, **Parcial** (com o motivo), **Fora** (com o motivo).

### Problemas de UI

| Item | Status | Como |
|---|---|---|
| UI-01 Títulos Homebase ilegíveis | Feito | Sombra preta removida; `display` limpo; sombra dura só em hero/conquista, em acento 2/2 (`Sombras.duraAcento`) |
| UI-02 Ícone/splash do Expo | Feito | Ícone, adaptive icon (fg/bg/monocromático), splash e favicon gerados do logo invertido; plugin `expo-splash-screen` configurado |
| UI-03 Check-in de 12px | Feito | `HeroCheckIn` com botão de 56px em largura total, 3 estados na mesma área |
| UI-04 App claro e genérico | Feito | Tema escuro, superfícies, Oswald para números, textura de lona nas bandas/hero |
| UI-05 Login genérico | Feito | Tela cheia escura, logo invertido, tagline display, CTA em acento |
| UI-06 Bandas copiadas 6× | Feito | `BandaIdentidade` (aluno/gestor, compacta, safe area) |
| UI-07 Nuvem de botões nos perfis | Feito | Lista de `ItemMenu` com seções Gestão/Conta |
| UI-08 Header + banda; excluir na tela principal | Feito | Header e banda no mesmo tema; exclusão em "Conta e privacidade" |
| UI-09 Cards de SaaS no gestor | Feito | Listas como linhas sobre o fundo, separadas por `LinhaFina` |
| UI-10 Ponto médio em metadados | Feito | Nenhum `·` unindo metadados em `src/screens`; chips e linhas separadas |
| UI-11 Enums crus | Feito | `utils/apresentacao.ts` ("Aberta agora", "Intermediário", "Aguardando validação") |
| UI-12 Números fora do Oswald | Feito | `Estatistica` e variantes de placar em todos os contadores |
| UI-13 Medalha genérica | Feito | Emblema SVG de fivela, ícone por marco, número em Oswald, ouro só na máxima |
| UI-14 Pódio sem pódio | Feito | Blocos com alturas, posição dentro do bloco, ouro no 1º |
| UI-15 Faixa sem cor | Feito | `SeloFaixa` SVG interpreta o texto livre (cor + graus), fallback neutro |
| UI-16 Ícone duplicado na sessão | Feito | Estado aparece uma vez; horário em placar à esquerda |
| UI-17 "‹ Voltar" centralizado | Feito | `Botao variante="voltar"` alinhado à esquerda com seta |
| UI-18 Quatro raios | Feito | Raio 2 (botões/placas), 4 (cards/inputs), pílula (só chips) |
| UI-19 Trilha invisível | Feito | Trilha em `linhaForte` (3,9:1) e forma diferente cheio/vazio |
| UI-20 Títulos de seção inconsistentes | Feito | `CabecalhoSecao` em todas as telas |
| UI-21 Checkbox sem ✓ | Feito | `Checkbox` com ✓. O texto da política continua placeholder (conteúdo jurídico, fora da UI) |
| UI-22 Ícones hardcoded / pouco legíveis | Parcial | Cor via token feita. Os desenhos de `IconeFaixa`/`IconePoste` não foram redesenhados (ganharam moldura circular e 32px na seleção de perfil) |

### Problemas de UX

| Item | Status | Como |
|---|---|---|
| UX-01 Check-in não é o centro | Feito | Hero logo abaixo da banda |
| UX-02 Links cinza de rodapé | Feito | `ItemMenu` com ícone e chevron |
| UX-03 "Meus vínculos" não mostra vínculos | Parcial | Renomeado para "Vincular-se"; listar os vínculos existentes exigiria consulta nova (R-06) |
| UX-04 Lista de vínculo sem busca | Feito | Busca local por nome/endereço, sem nova consulta |
| UX-05 Formulário antes da lista | Feito | Lista primeiro; "+ Nova turma/sessão/missão" em `Folha` |
| UX-06 "Nova sessão" ambígua | Feito | Campo "Semana de referência" com ajuda; botão "Criar N sessões" |
| UX-07 Ranking "mensal" cumulativo | Feito | Texto honesto (R-04); a janela RN04 em si está fora (backend) |
| UX-08 Missões sem filtro | Feito | `Abas` Em curso / Concluídas com contagem |
| UX-09 Exclusão exposta | Parcial | Movida para "Conta e privacidade"; a exclusão continua falhando no backend (pendência anterior, `firestore.rules`) |
| UX-10 Erros técnicos crus | Feito | `mensagemErro()`; zero `setErro(e.message)` |
| UX-11 Loading inconsistente | Feito | `Esqueleto` (bloco/linha) nas telas; spinner só no carregamento de raiz |
| UX-12 Sem feedback de sucesso | Feito | `Aviso` de sucesso em matrícula, pedido de vínculo, criação de turma e de sessão |
| UX-13 Erro do dashboard sem retry | Feito | `EstadoErro` com "Tentar novamente" nos dashboards e na Agenda |
| UX-14 Loading "..." | Feito | Estado ocupado (busy + opacidade) no botão de presença |
| UX-15 Vazios sem CTA | Feito | Ícone 64px + CTA onde há destino (Home, Classificação, Bloqueio, Turmas) |
| UX-16 Celebração só do professor | Feito | `MomentoConquista` do lado do aluno (nível, faixa, medalha), detecção local |
| UX-17 Datas como texto livre | Parcial | Máscara `DD/MM/AAAA` e `HH:MM` com number-pad; sem date picker (não aprovado) |
| UX-18 Placeholder parece valor | Feito | Campo com fundo próprio; senha sem placeholder de bolinhas |
| UX-19 Teclado cobre campos | Feito no código | `KeyboardAvoidingView` em `Tela teclado` e na `Folha` com rolagem; precisa de teste nativo |
| UX-20 Faixa como texto livre | Parcial | Modelo mantido por decisão; prévia visual da faixa ao digitar |
| UX-21 Botão desabilitado sem explicação | Feito | Ajuda abaixo do botão (Turmas, LGPD) |
| UX-22 Sem mostrar senha / autocomplete | Feito | Olho para mostrar/ocultar; `autoComplete`/`textContentType`; Enter encadeia campos no Login |

### Recomendações

| Item | Status | Observação |
|---|---|---|
| R1 Sombra dos títulos | Feito | |
| R2 Ícone e splash | Feito | Requer novo build nativo para valer no aparelho |
| R3 Safe area | Feito | `SafeAreaProvider`, `Tela bordas`, banda e tab bar com insets |
| R4 maxWidth web/tablet | Feito | 480 (auth/forms) e 720 (listas) |
| R5 Foco visível | Feito | Anel em acento + sublinhado em acento nos campos |
| R6 Labels/roles | Feito | axe sem violações |
| R7 Erros traduzidos + retry | Feito | |
| R8 Enums e ponto médio | Feito | |
| R9 Direção "Noite de luta" | Feito | `docs/DESIGN.md` |
| R10 Hero de check-in | Feito | |
| R11 BandaIdentidade | Feito | |
| R12 Sistema tipográfico | Feito | `Texto` com 10 variantes |
| R13 Faixa com cor | Feito | Por interpretação do texto, sem mudar o modelo |
| R14 Perfis | Feito | |
| R15 Telas de gestor | Feito | |
| R16 Login | Feito | |
| R17 Data/hora | Parcial | Máscaras sim, picker não (dependência não aprovada) |
| R18 Momentos de conquista | Feito | Sem som (não pedido) |
| R19 Medalhas emblema | Feito | |
| R20 Pódio real | Feito | |
| R21 Motion | Parcial | Feito com `Animated` + `expo-haptics`; `reanimated` não aprovado |
| R22 Ilustrações de vazio | Feito | Ícones próprios em 64px |
| R23 Responsivo 2 colunas / rail | Fora | Decisão: só `maxWidth` por enquanto |

---

## O que ficou de fora e por quê

- **Lint**: o projeto não tem ESLint; configurar exigiria dependências não aprovadas (R-01).
- **`expo-system-ui`**: necessário para `userInterfaceStyle`/`backgroundColor` raiz terem efeito no Android/iOS; não aprovado (R-02). O fundo escuro é garantido pelo próprio app.
- **Layout de 2 colunas e rail lateral** no web/tablet: fora por decisão (só `maxWidth`).
- **`react-native-reanimated`, `expo-linear-gradient`, date picker**: não aprovados; motion com `Animated`, gradientes não foram necessários, datas com máscara.
- **Faixa estruturada** (cor/graus como campo): fora por decisão; o `SeloFaixa` interpreta o texto (R-05).
- **Tela real de "Meus vínculos"**, **professor no hero da Home** e **medalha de graduação na detecção de conquistas**: exigiriam consultas novas ao Firestore (R-06, R-07, R-09).
- **Confirmação ao encerrar sessão**: comportamento original mantido (R-08).
- **Persistência das conquistas no servidor**: pedido explícito de não gravar no Firebase (R-10).
- **Texto jurídico da LGPD** e **licença da fonte Homebase**: não são decisões de UI.
- **Validação visual das telas autenticadas que não têm composição** (Agenda, Histórico, Missões, Turmas disponíveis, Vincular, Turma/Sessão detalhe, Alunos, Solicitações, Missões do gestor, Relatório, Visão consolidada, Editar perfil, Conta e privacidade): renderizá-las exige login no Firebase real, o que estava vedado. Foram migradas com os mesmos componentes validados na Galeria e conferidas por `tsc`, mas **não foram vistas renderizadas**. Recomendo um emulador do Firebase ou uma conta de teste para a próxima rodada.
- Aviso `props.pointerEvents is deprecated` no console do web: vem do `@react-navigation/bottom-tabs`, não do app.

---

## O que precisa de teste em dispositivo nativo

O redesign só foi visto no web (react-native-web). Testar em iOS (com notch/Dynamic Island) e Android:

**Safe area e layout**
- Topo das telas sem header (Login, auth, Home/Hoje com `BandaIdentidade`, Bloqueio): conteúdo abaixo da status bar/notch.
- Tab bar: altura 56 + inset inferior; rótulos acima do home indicator; traço de acento na aba ativa.
- `MomentoConquista` em tela cheia (insets superior/inferior) e `Folha` (inset inferior).
- Status bar sempre clara em todas as abas.

**Teclado**
- Login/Cadastros/Recuperar senha/Editar perfil (`Tela teclado`): campo focado visível acima do teclado.
- `Folha` com formulário ("Nova turma", "Nova sessão", "Nova missão"): `KeyboardAvoidingView` (`padding` no iOS, `height` no Android) + rolagem interna.
- Enter no e-mail vai para a senha e na senha envia (Login); teclado numérico nos campos com máscara.

**Haptics e motion**
- `expo-haptics`: check-in (impacto + sucesso), graduação registrada, momento de conquista. No Android, a doc do SDK 57 sugere `performAndroidHapticsAsync` como alternativa sem a permissão `VIBRATE`; hoje usamos `impactAsync`/`notificationAsync` (permissão adicionada automaticamente).
- Punch/flash do check-in, entrada do momento de conquista, contador de XP e barra com driver nativo.
- Com "Reduzir movimento" (iOS) / "Remover animações" (Android) ligado: sem punch, flash, shimmer nem animação de modal/aba.

**Plataforma**
- Ícone, adaptive icon (incluindo o monocromático do Android 13+) e splash: exigem novo build nativo (prebuild/EAS).
- `userInterfaceStyle: "dark"` sem `expo-system-ui`: verificar se aparece fundo claro atrás da raiz em transições (R-02).
- `Switch` do `Toggle` (cores de trilha/thumb em cada plataforma).
- Leitor de tela (VoiceOver/TalkBack): títulos como cabeçalho, chips como radio/checkbox, Toggle como switch, anúncio de erros e avisos.
- Fonte grande do sistema (Dynamic Type / escala de fonte): placares e display limitados a 1,3×; conferir quebras em banda, hero e linhas de lista.
- `AsyncStorage` das conquistas: primeira abertura não celebra; subir de nível e reabrir a Home celebra uma vez.
