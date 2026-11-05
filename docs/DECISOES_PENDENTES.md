# Decisões pendentes de validação — Ciclo 2 / parte do Ciclo 3

Lista de checagem para revisão com a orientadora antes da entrega do TCC. Toda decisão aqui foi tomada pela opção **mais simples de implementar**, não a mais debatida, para destravar a construção e o teste da interface agora — não são recomendações de produto finais.

---

## Bloqueios de backend — resolver antes da entrega final

Diferente da lista numerada abaixo (decisões de **métrica/produto** de gamificação, ajustáveis por número), isto é um **bloqueio de funcionalidade**: sem isso, RF29 não funciona de verdade em produção, independente de qualquer decisão de produto.

### RF29 — exclusão de conta: ✅ RESOLVIDO (limpeza em cascata por Cloud Function)

A exclusão agora roda na callable `excluirConta` (`functions/src/exclusaoConta.ts`, Admin SDK), chamada por `AuthContext.excluirConta()`. Ela só apaga o uid do token de quem chama e faz, nesta ordem:

1. Apaga os dados do usuário como aluno: `matriculas`, `checkins`, `classificacoes`, `missoesProgresso`, `graduacoes` e `consentimentosLGPD`.
2. Tira o uid de `leitoresIds` de todas as sessões.
3. Se for professor ou academia, trata as turmas (decisão abaixo).
4. Apaga os `vinculos` em que ele é solicitante ou destinatário. Quando era destinatário de um vínculo aceito, o id sai de `responsaveisIds` do solicitante e, se o solicitante for professor, `autonomo` volta a `true` (mesmo efeito de `encerrarVinculo()`).
5. Apaga `usuarios/{uid}` com a subcoleção `privado`.
6. Apaga os arquivos em `usuarios/{uid}/` no Storage.
7. Por último, apaga a conta no Firebase Auth. Se algo antes falhar, a conta continua existindo e o usuário pode tentar de novo (todos os passos são idempotentes).

`usuarios.delete` continua `false` em `firestore.rules`: o client nunca apaga a conta direto. Teste de integração em `tests/functions/exclusao-conta.test.ts`, que agora sobe também os emuladores de Auth e Storage.

**Decisão para professor e academia (tomada pelo autor):**
- Turma com alguma matrícula de aluno não é apagada. Ela vira inativa, as sessões futuras (`agendada`/`aberta`) viram `cancelada` e as matrículas ativas viram `inativa`, preservando o histórico dos alunos (check-ins, pontos, graduações e progresso de missões, que são dados deles).
- Turma sem nenhuma matrícula é apagada junto com as sessões.
- Turma de academia em que ele só leciona perde o campo `professorId`.
- Missões do responsável viram inativas; o progresso dos alunos fica.

**A validar:** nesses documentos preservados fica o uid do responsável excluído (`responsavelId`, `professorId` de sessões passadas, `validadoPor`). Tratei como pseudonimizado, porque depois da exclusão de `usuarios/{uid}` e da conta no Auth o uid não identifica mais ninguém. Também apago `consentimentosLGPD`, como pedido; se a orientação jurídica for guardar o registro de consentimento como prova, basta tirar essa coleção da função.

### RF31 — notificações: ✅ IMPLEMENTADO, envio real depende de configuração externa

**O que está pronto:**
- **App** (`src/services/notificacoes.ts`): no login, cria o canal Android, pede permissão, obtém o token Expo e grava em `usuarios/{uid}/privado/notificacoes.tokens`; no logout, remove o token. Na web não faz nada (o SDK 57 só tem push em Android e iOS). Plugin `expo-notifications` adicionado ao `app.json`.
- **Cloud Functions** (`functions/src/notificacoes.ts`), sempre respeitando `preferenciasNotificacao` por tipo:
  - **Nova missão:** quando uma missão é criada ativa ou reativada, avisa os alunos com vínculo aceito.
  - **Conquista obtida:** missão concluída, graduação registrada e marcos de medalha de treinos (10/30/100) e de sequência (7/30 dias). Cada conquista é avisada uma vez só por aluno (`conquistasNotificadas`), mesmo com estorno e revalidação.
  - **Lembrete de sessão:** função agendada todo dia às 7h (horário de Brasília). Manda **um lembrete por aluno por dia de treino**, com o horário da primeira sessão agendada ou aberta do dia; `ultimoLembrete` impede um segundo envio se o agendamento rodar de novo.
- Cada envio fica registrado na coleção `notificacoes` (sem acesso de client), com status `enviado`, `erro`, `semDispositivo` ou `simulado`. No emulador nada sai para a internet: o status é `simulado`. Tokens que a Expo recusa (`DeviceNotRegistered`) são removidos.
- A exclusão de conta (RF29) apaga o token e o histórico de notificações.

**Passos que dependem do autor (não dá para fazer daqui):**
1. **Plano Blaze** no projeto Firebase: necessário para fazer deploy de qualquer Cloud Function (isso já valia para as funções anteriores) e para o Cloud Scheduler do lembrete diário. Depois: `npx firebase deploy --only functions,firestore`.
2. **`npx eas init`** na raiz do app: grava `extra.eas.projectId` no `app.json`. Sem isso, `getExpoPushTokenAsync` falha e o app só registra um aviso no console.
3. **Credenciais de push no EAS:** para Android, criar o app no Firebase Console, baixar a chave da conta de serviço do FCM V1 e enviar com `npx eas credentials`; para iOS, a chave APNs (exige conta Apple Developer).
4. **Development build** (`npx eas build --profile development`): push remoto não funciona no Expo Go no Android desde o SDK 53.
5. Opcional: se ligar o "enhanced security for push" no projeto Expo, configurar a variável `EXPO_ACCESS_TOKEN` nas functions.

**Divergência de código de requisito:** o pedido citava "RNF03 do relatório" para o limite de um lembrete por dia de treino. Na lista oficial (`docs/requisitos/requisitos-v1-2026-09.csv`), o RNF03 é "Armazenamento seguro de credenciais", e nenhum requisito fala desse limite. O código implementa o limite, mas o rastreia só como RF31. **A validar:** qual código o relatório deve usar para essa regra.

---

## 1. Valores de gamificação (`src/config/gamificacao.ts`)

- **RF16** — `XP_POR_CHECKIN_VALIDADO = 10`: quantidade arbitrária, sem nenhuma pesquisa de balanceamento por trás.
- **RF17** — tabela de níveis `NIVEIS_XP`: progressão provisória em +50 por degrau (100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250), 10 níveis. Sem base em literatura de gamificação nem teste com usuário.
- **RF19** — marcos de medalha (`MARCOS_MEDALHAS`): 6 marcos (10/30/100 treinos, 7/30 dias de sequência, 1ª graduação), números escolhidos sem validação.
- **RF20/RN04** — ✅ **RESOLVIDO**: a classificação é mensal de verdade. Cada mês tem o próprio documento (`classificacoes/{alunoId}_{responsavelId}_{AAAA-MM}`), creditado na mesma transação de `validarCheckIn`, no mês (fuso local) em que o treino aconteceu. O ranking mostra só o mês corrente; o nível (RF17) continua somando todos os meses. Ver item 4.

**✅ Resolvido (RF33):** os números de pontos por check-in, pontos por missão e tabela de níveis viraram configuração real por responsável (item 8). Os valores acima continuam como **padrão** de quem não personalizou e continuam sem validação de balanceamento.

---

## 2. `missoesProgresso` — quem escreve (RF18) — ✅ RESOLVIDO

O aluno continua sem permissão para escrever o próprio progresso (testado em `tests/rules/missoes.test.ts`).

- **Presença, pontuação e sequência:** progresso automático. A Cloud Function `atualizarMissoesNoCheckIn` roda quando um check-in entra ou sai de `validado` e recalcula do zero o progresso do aluno em todas as missões automáticas ativas do responsável. Ela conta só check-ins validados **a partir da criação da missão**. Presença conta check-ins; pontuação soma os pontos dos check-ins (sem os pontos de outras missões); sequência usa a **maior** sequência de dias seguidos desde a criação, para a missão concluída não voltar a "em curso" quando a sequência quebra. Um estorno de validação pode desfazer a conclusão.
- **Personalizada:** o responsável marca a conclusão à mão, aluno por aluno, no botão "Marcar conclusões" da tela de missões do gestor. A regra só deixa o responsável escrever progresso de missão personalizada dele.
- **Pontos da missão:** a Cloud Function `creditarPontosDaMissao` credita `missao.pontos` na classificação do mês da conclusão e estorna se a conclusão for desfeita. `pontosCreditados`/`periodoCredito` no próprio progresso evitam crédito em dobro; o client não pode escrever esses campos. RN01 continua valendo: a conclusão sempre vem de check-in validado pelo responsável ou de marcação do próprio responsável.
- `missoesProgresso.delete` passou a ser negado ao client: apagar um progresso concluído deixaria os pontos creditados sem estorno.
- A tela de missões do aluno passou a mostrar as missões de todos os vínculos ativos, não só do primeiro.

**A validar:** se missão desativada deve parar de contar (hoje, sim: só missões ativas são recalculadas, e o progresso já alcançado fica).

---

## 3. `graduacoes` — histórico imutável (RF25, RN03)

**Decidido:** depois de criada, uma graduação não pode ser editada nem apagada (`allow update, delete: if false`, mesmo padrão de `consentimentosLGPD`) — opção mais simples, em vez de permitir ao responsável corrigir um lançamento errado.

**Decisão a validar:** um erro de digitação (ex.: grau errado) fica permanente no histórico, corrigível só por um novo lançamento posterior explicando a correção? Ou precisa de um caminho de correção?

---

## 4. `classificacoes` — modelo de dados e leitura (RF20, RN04, RN09, RNF11) — ✅ RESOLVIDO

**Modelo:** um documento por aluno, responsável e mês, `classificacoes/{alunoId}_{responsavelId}_{AAAA-MM}`, com o campo `periodo`. A trava de RN01 continua igual (create só com 10 pontos, update só ±10), e a regra agora também exige `periodo` no formato `AAAA-MM` e batendo com o id.

**RN04:** o ranking consulta só o `periodo` do mês corrente, então recomeça sozinho na virada do mês. O estorno de uma validação cai no documento do mês do treino, mesmo que seja feito no mês seguinte.

**RN09 (escopo segue o vínculo):** a leitura deixou de ser aberta a qualquer autenticado. Mesmo padrão de `leitoresIds` das sessões: a regra libera o próprio aluno, o responsável do escopo e quem estiver em `leitoresIds`. Esse campo é mantido só por Cloud Function (`functions/src/classificacao.ts`): o client não pode criá-lo nem alterá-lo. Ele é recalculado quando o documento nasce, quando um vínculo de aluno entra ou sai de `aceito` e quando o aluno muda a preferência de participação. A consulta do ranking filtra `leitoresIds array-contains meuId()`, o que a torna provável pela regra.

**RNF11 (adesão opcional):** novo campo `usuarios.participaClassificacao` (ausente = participa). Toggle "Participar da classificação" no Perfil do aluno, logo abaixo de "Notificações". Quem não participa tem `leitoresIds` = responsável + ele mesmo: some do ranking dos outros alunos, mas continua vendo a própria pontuação (a tela avisa isso). O responsável continua vendo todos os alunos do escopo.

**Sem migração:** documentos antigos (`{alunoId}_{responsavelId}`, sem `periodo`) ficam no banco. Eles continuam somando no nível do aluno, mas não aparecem em nenhum ranking mensal e não recebem `leitoresIds`.

**A validar:**
- O "mês" é o do fuso do aparelho de quem valida o check-in (o professor). Para alunos e academia no mesmo fuso, é o mesmo mês do treino.
- Aluno cujo vínculo foi encerrado some do ranking dos colegas, mesmo com pontos no mês.

---

## 5. RF19 — medalhas sem coleção persistida

Medalhas são calculadas ao vivo (`src/utils/gamificacao.ts`, `calcularMedalhas()`) a partir de contagens que o aluno já pode ler (check-ins validados, sequência atual, total de graduações) — **não há registro de quando uma medalha foi conquistada**. A notificação de nova conquista agora existe (RF31, acima); a chave de cada conquista avisada fica em `usuarios/{uid}/privado/notificacoes.conquistasNotificadas`, mas isso não é um histórico com data.

**Decisão a validar:** isso é suficiente para o Ciclo 2, ou medalha precisa de um registro persistido (data de conquista, e futuramente notificação)?

---

## 6. RF21 — sequência conta dias, não sessões

`calcularSequencia()` conta **dias consecutivos com ao menos um check-in validado**, não sessões consecutivas — um aluno que treina 2x no mesmo dia soma 1 dia de sequência, não 2. Também não distingue "faltou porque a academia não teve aula naquele dia" de "faltou porque o aluno não foi": qualquer dia sem check-in validado quebra a sequência, mesmo sem sessão agendada.

**Decisão a validar:** sequência por dia civil está correto, ou deveria ser por sessão agendada (só quebra se houve sessão e o aluno não foi)?

---

## 7. Aluno com mais de um vínculo ativo — qual escopo aparece — ✅ RESOLVIDO

- **Nível/XP no Dashboard:** continua somando os pontos de **todos** os escopos e meses do aluno (`listarClassificacoesDoAluno`), um único número de XP pessoal.
- **Tela de Classificação:** com mais de um vínculo ativo, aparece um seletor de escopo (`Abas`) com o nome de cada academia ou professor. Com um vínculo só, a tela continua igual.

---

## 8. `configuracoesGamificacao` (RF33) — ✅ RESOLVIDO (pontuação e níveis), faixas pendente

Tela "Pontuação e níveis" no Perfil do professor e da academia (`ConfiguracaoGamificacaoScreen`). Ela grava `configuracoesGamificacao/{uid}` com pontos por check-in (1 a 100), pontos sugeridos por missão (0 a 1000) e a tabela de níveis (1 a 30 valores crescentes). "Restaurar padrão" apaga o documento; sem documento valem os padrões de `src/config/gamificacao.ts`.

**RN01 sem brecha:** a trava fixa de ±10 em `classificacoes` virou um vínculo de mão dupla com o check-in, na mesma transação:
- o check-in só pode ir de 0 para os pontos por check-in **do responsável** (configuração ou 10) ou de volta a 0, e grava `classificacaoId`;
- a classificação grava `origemCheckinId`, e a regra confere que o delta dela é exatamente o que os pontos daquele check-in mudaram;
- o check-in confere que a classificação mudou junto pelo mesmo delta. Sem isso, zerar o check-in sem estornar e validar de novo creditaria duas vezes.

O estorno devolve o que o check-in recebeu, mesmo que a configuração tenha mudado depois. Pontos de missão: a missão passou a aceitar só inteiros de 0 a 1000 (antes, qualquer número), e o crédito é da Cloud Function (item 2). A configuração é apagada na exclusão de conta do responsável (RF29).

**Decisões tomadas (a validar):**
- **Pontos por missão** é o valor que já vem preenchido ao criar uma missão. O responsável ainda pode mudar o valor de cada missão, dentro do limite de 1000.
- **Nível do aluno com mais de um vínculo:** o XP exibido continua sendo o total de todos os escopos, e a tabela de níveis usada é a do responsável em que o aluno mais pontuou.
- A ordem crescente da tabela de níveis é validada no app, não na regra (Rules não tem laço para percorrer listas). Um responsável que gravasse direto pela API uma tabela fora de ordem só bagunçaria o nível dos próprios alunos.

**Fora desta rodada:** o RF33 também cita "a estrutura de faixas da modalidade". Hoje a faixa é texto livre (`faixaOuGrau`, interpretado pelo `SeloFaixa`, ver R-05). Personalizar a estrutura de faixas exige um campo estruturado de faixa por modalidade e mudança no cadastro, na graduação (RF25) e no modelo de dados — é decisão de produto, não foi feita.

---

## 9. `Alunos` e `Visão consolidada` (RF24, RF27) seguem em `TelaEmBreve`

Confirmado no plano anterior (`docs/PLANO_REGRAS_CICLO2_3.md`): essas duas não precisam de regra nova (dado já desbloqueado), só de função de serviço que componha e da tela — não fizeram parte deste pacote, que ficou restrito a RF16–RF21.

---

## Redesign "Noite de luta" — decisões tomadas pela opção conservadora

### R-01 — Lint não existe no projeto
O pedido de rodar "o lint" ao fim de cada fase não tem alvo: não há ESLint, config nem script `lint` no `package.json`. `npx expo lint` instalaria `eslint` e `eslint-config-expo` e criaria um arquivo de config — dependências fora da lista aprovada (só `expo-haptics`). **Decisão:** não configurar; a verificação por fase é `npx tsc --noEmit` (modo `strict`). **A validar:** aprovar `npx expo lint` numa rodada própria.

### R-02 — `userInterfaceStyle: "dark"` e `backgroundColor` raiz exigem `expo-system-ui`
Pela doc do SDK 57 (`config/app`), `userInterfaceStyle` no Android e o `backgroundColor` raiz no iOS só têm efeito com `expo-system-ui` instalado. Não está na lista aprovada. **Decisão:** configurar os dois campos no `app.json` mesmo assim (inofensivos sem o pacote) e garantir o fundo escuro pelo próprio app (`App.tsx` + tema do React Navigation). Sem o pacote, pode haver um frame da cor padrão do sistema atrás da raiz em transições nativas. **A validar:** aprovar `npx expo install expo-system-ui`.

### R-03 — Qual é a "medalha de nível máximo" (única em ouro)
`docs/DESIGN.md` reserva o ouro para o 1º do ranking e a "medalha de nível máximo", mas os marcos de `src/config/gamificacao.ts` não têm uma medalha de nível. **Decisão:** a medalha mais alta da progressão principal (`treinos-100`, "100 treinos") é a única marcada como `maxima`. **A validar:** se deve ser outra (ex.: uma medalha nova de "nível 11"), o que exigiria mudar a config de marcos.

### R-04 — Texto da Classificação deixa de dizer "Ranking mensal" — ✅ DESFEITO
Com RN04 implementada (item 4), a tela voltou a dizer "Ranking mensal de {mês}: pontos dos treinos validados neste mês na sua academia ou professor".

### R-05 — Faixa interpretada a partir do texto livre
O `SeloFaixa` deduz cor e graus de `faixaOuGrau`/`graduacao` (texto livre) sem mudar o modelo. Termos fora da lista (ex.: "Kruang 5", "prajied rosa") caem no visual neutro com o texto original. **A validar:** se o produto quer um campo estruturado de faixa no futuro (mudança de modelo e de Firestore, fora deste redesign).

### R-06 — "Meus vínculos" virou "Vincular-se"
A tela aberta por "Meus vínculos" só lista academias/professores para pedir vínculo; não mostra os vínculos existentes (RELATORIO_UI_UX.md, UX-03). Mostrar os existentes exigiria uma consulta nova ao Firestore, fora do escopo (redesign só de apresentação). **Decisão:** renomear o item e o título da tela para "Vincular-se". O estado "Enviado" continua local à tela. **A validar:** criar uma tela real de "Meus vínculos" (com pendentes e aceitos) numa rodada de funcionalidade.

### R-07 — Home do Aluno sem o nome do professor no hero
O HeroCheckIn aceita `professor`, mas a Home não buscava o professor de cada sessão (a Agenda busca). Buscar exigiria uma chamada nova ao Firestore na Home. **Decisão:** a Home não mostra o professor; a Agenda mostra. **A validar:** se vale a leitura extra.

### R-08 — "Encerrar sessão" sem confirmação
A ação principal da sessão virou botão primário, mas segue sem diálogo de confirmação (comportamento original). **A validar:** se encerrar por engano é um risco real (a sessão encerrada não reabre).

### R-09 — Conquistas: medalha de graduação fora da detecção
O `useConquistas` só detecta medalhas de treinos e de sequência. A de "Primeira graduação" depende de `graduacoes`, que a Home não lê; ler exigiria uma consulta nova ao Firestore. A subida de faixa em si é detectada (pelo `usuario.faixaOuGrau`). **A validar:** se vale adicionar a leitura de graduações na Home.

### R-10 — Conquistas detectadas por aparelho
O "último estado" fica no AsyncStorage do aparelho: num aparelho novo, a primeira abertura só grava (não celebra), e o mesmo aluno em dois aparelhos pode ver a mesma conquista duas vezes. Persistir no Firebase resolveria, mas o pedido foi não gravar nada lá. **A validar:** se isso basta.
