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

### RF31 — notificações: ✅ IMPLEMENTADO e pronto para build; falta a validação em aparelho (passos do autor)

**O que está pronto:**
- **App** (`src/services/notificacoes.ts`): no login, cria o canal Android `padrao`, pede permissão, obtém o token Expo (o `projectId` é lido sozinho de `extra.eas.projectId`, conforme o `getExpoPushTokenAsync` do SDK 57.0.17 instalado) e grava em `usuarios/{uid}/privado/notificacoes.tokens`. No logout, remove o token. Na web não faz nada.
- **Configuração de build (rodada de 2026-11-13):**
  - `app.json` com `android.package` e `ios.bundleIdentifier` = `br.com.roundup.app` (decisão do autor);
  - plugin `expo-notifications` com `defaultChannel: "padrao"`, o mesmo canal das functions;
  - `eas.json` com os perfis `development` (dev client, APK, distribuição interna), `preview` e `production`;
  - `expo-dev-client` instalado;
  - `app.config.js`, que liga o `google-services.json` só se o arquivo existir (ou pela variável de arquivo `GOOGLE_SERVICES_JSON` no EAS).
- **Cloud Functions** (sempre respeitando `preferenciasNotificacao` por tipo):
  - **Nova missão** (`missoesPublico.ts`, RF23): só para o **público-alvo**, quando a missão fica vigente para o aluno, uma vez por aluno (`alunosNotificadosIds`). Antes avisava todos os vinculados.
  - **Conquista:** missão concluída, graduação registrada e medalha nova de treinos ou de sequência (`medalhas.ts`, RF19). Cada conquista é avisada uma vez por aluno (`conquistasNotificadas`).
  - **Lembrete de sessão:** agendado todo dia às 7h (Brasília), um por aluno por dia de treino (`ultimoLembrete`).
- Cada envio fica registrado em `notificacoes` com status `enviado`, `erro`, `semDispositivo` ou `simulado` (emulador). Tokens recusados pela Expo (`DeviceNotRegistered`) são removidos.

**Revisão de código (2026-11-13):** nada bloqueante. Limitações conhecidas:
- o envio confere só o "ticket" da Expo, não o "receipt" (confirmação da entrega pelo FCM/APNs). `enviado` quer dizer aceito pela Expo, não exibido no aparelho;
- tocar na notificação abre o app, mas não navega para a tela de `dados.tela` (não há listener de resposta);
- o plugin usa `mode: development` no iOS (padrão). Um build de App Store precisa de `mode: "production"`.

**Automação para testar sem terminal (2026-11-13):**
- **Workflow** `.github/workflows/preparar-teste-notificacoes.yml`. Com os secrets `FIREBASE_SERVICE_ACCOUNT` e `EXPO_TOKEN`, ele:
  - faz o deploy com `--force` (apaga `notificarNovaMissao` e `notificarMarcoDeTreino`, que saíram do código, e configura a política de limpeza que falhou no deploy de 08/11);
  - roda as 3 migrações e as contas demo, e publica a web;
  - cadastra o app Android no Firebase e gera o `google-services.json`;
  - leva para o EAS a configuração `EXPO_PUBLIC_FIREBASE_*` (antes só existia no `.env` local) e a chave FCM V1 (`scripts/configurar-fcm-eas.cjs`, mesma API do `eas-cli`);
  - gera o APK do perfil `preview`, que abre sem Metro.
- **Botões "Testar neste aparelho"** na tela Notificações: a callable `enviarNotificacaoDeTeste` manda um exemplo de cada tipo só para o próprio usuário, pelo caminho real, e devolve o status (`enviado`, `semDispositivo`, `desligado`…). Um teste a cada 15 s por usuário.
- **Risco aceito:** a mesma chave de conta de serviço publica no Firebase (guardada como secret do GitHub) e serve de chave FCM V1 no EAS. Retirar o papel extra depois dos testes, e revogar a chave se não for mais usar.
- **Não testado contra as contas reais:** a primeira execução do workflow pode precisar de ajuste.

**O que depende do autor** (passo a passo em **`docs/ROTEIRO_TESTE_NOTIFICACOES.md`**, "Caminho fácil"):
- plano Blaze e deploy;
- `eas init` (`projectId`);
- `google-services.json` e chave FCM V1 no EAS;
- chave APNs (iOS, Apple Developer);
- `eas build --profile development`;
- disparar os 3 tipos no celular e registrar o resultado.

Não foi possível consultar docs.expo.dev desta sessão (host fora da rede liberada). A configuração foi conferida no código e na documentação empacotados do `expo-notifications` 57.0.17 instalado.

**Divergência de código de requisito:** o pedido citava "RNF03 do relatório" para o limite de um lembrete por dia de treino. Na lista oficial (`docs/requisitos/requisitos-v1-2026-09.csv`), o RNF03 é "Armazenamento seguro de credenciais", e nenhum requisito fala desse limite. O código implementa o limite, mas o rastreia só como RF31. **A validar:** qual código o relatório deve usar para essa regra.

### Ambiente das Cloud Functions — parcialmente alinhado

- `firebase-functions` atualizado de 7.3.2 para 7.4.0 (versão menor; o aviso de "outdated" do emulador sumiu). `firebase-admin` continua fixo em 13.10.0 pelo motivo registrado em `docs/decisoes-tecnicas.md` (o 14.x quebra o emulador com `ERR_REQUIRE_ESM`).
- **Node:** `functions/package.json` continua declarando Node 22, que é o runtime certo para o deploy (o Cloud Functions não suporta versões ímpares como a 21). A máquina de desenvolvimento tem Node 21, e o emulador avisa e usa a 21. Os testes passam assim. Para alinhar de vez é preciso instalar o Node 22 na máquina (ex.: pelo instalador oficial ou `nvm-windows`) — mudança de sistema, não foi feita.
- **Java:** o `firebase-tools` 15 exige Java 21+, e o Java padrão da máquina é o 20. Os testes desta rodada rodaram com o OpenJDK 22 de `~/.jdks`, só na execução.

---

## 1. Valores de gamificação (`src/config/gamificacao.ts`)

- **RF16** — `XP_POR_CHECKIN_VALIDADO = 10`: quantidade arbitrária, sem nenhuma pesquisa de balanceamento por trás.
- **RF17** — tabela de níveis `NIVEIS_XP`: progressão provisória em +50 por degrau (100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250), 10 níveis. Sem base em literatura de gamificação nem teste com usuário.
- **RF19** — marcos de medalha (`MARCOS_MEDALHAS`, copiados em `functions/src/medalhasRegras.ts`): 6 marcos (10/30/100 treinos, 7/30 treinos seguidos, 1ª graduação), números escolhidos sem validação.
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

## 5. RF19 — medalhas persistidas com data de conquista — ✅ RESOLVIDO

**Modelo:** subcoleção `usuarios/{alunoId}/medalhas/{marcoId}` (id = id do marco), com `tipo`, `quantidade`, `rotulo`, `conquistadaEm`, `origem` (`checkin` | `graduacao` | `migracao`) e `registradaEm`.

**Quem escreve:** só a Cloud Function (`functions/src/medalhas.ts`):
- `concederMedalhasNoCheckIn` roda quando um check-in vira `validado` (marcos de treinos e de sequência, em todos os escopos do aluno);
- `concederMedalhasNaGraduacao` roda quando uma graduação é registrada.

A cada disparo, o histórico é recalculado (`medalhasRegras.ts`) e cada marco atingido sem documento vira medalha, numa transação (sem duplicar). A regra do Firestore libera leitura ao aluno e aos responsáveis com vínculo aceito, e nega qualquer escrita do client.

**RF31:** a medalha nova de treinos ou de sequência é avisada uma vez (mesma chave `medalha:{id}` de `conquistasNotificadas`, então quem já foi avisado antes desta mudança não é avisado de novo). A medalha de graduação não gera aviso próprio, porque a graduação já é avisada. A função antiga `notificarMarcoDeTreino` saiu.

**Interface:** a medalha conquistada mostra a data embaixo do rótulo (componente `Medalha`, Perfil do aluno). As bloqueadas continuam vindo do cálculo ao vivo (`combinarMedalhas`).

**Decisões tomadas:**
- **Estorno não retira a medalha.** Validação desfeita, sequência quebrada ou contagem que caiu depois não apagam o documento; o recálculo só cria o que falta. É a recomendação do pedido; **a validar com a orientadora.**
- **Data numa conquista nova:** o instante em que o servidor registrou a medalha (logo após a validação).
- **Data na migração:** reconstruída do histórico. Treinos: o `validadoEm` do N-ésimo check-in validado (sem ele, o horário do treino). Sequência: a validação da sessão que completou N seguidos. Graduação: a primeira registrada. Se as sessões forem validadas fora de ordem, a data da sequência é aproximada.

**Migração:** `npm --prefix functions run build` e depois `node scripts/migrar-medalhas.cjs --aplicar` (dry-run sem `--aplicar`). Usa a mesma função da Cloud Function, com `origem: 'migracao'` e sem avisar ninguém, e pode rodar de novo sem efeito. **Ainda não foi rodado em produção.** Até rodar, o Perfil continua mostrando as medalhas já atingidas (cálculo ao vivo), só que sem data.

**Ainda fora:** a Home (`useConquistas`, R-09 e R-10) continua celebrando a partir do cálculo ao vivo e do estado salvo no aparelho. Com o registro persistido, dá para trocar essa detecção por "medalha com `registradaEm` mais nova que a última vista", sem AsyncStorage (fica para outra rodada).

---

## 6. RF21 — sequência por sessão agendada — ✅ RESOLVIDO

A sequência passou a contar **sessões**, não dias civis: `calcularSequencia()` (app) e `maiorSequenciaDeSessoes()` (`functions/src/sequencia.ts`, missão de sequência e medalha) usam o mesmo critério. Percorrendo as sessões do aluno (as que têm ele em `leitoresIds`):
- check-in validado conta +1;
- sessão cuja janela de check-in já fechou sem presença validada (faltou ou foi rejeitado) **quebra** a sequência;
- sessão cancelada, sessão com a janela ainda aberta e check-in pendente de validação **não contam nem quebram**;
- dia sem sessão não afeta nada, e duas sessões no mesmo dia contam 2.

Os textos mudaram de "dias seguidos" para "treinos seguidos" (indicador da Home e medalhas de sequência). O app lê as últimas 120 sessões do aluno (`listarSessoesPassadasDoAluno`), o que limita a sequência exibida a 120 — a maior medalha é 30. Novo índice composto em `sessoes` (`leitoresIds` + `inicio` decrescente, e `leitoresIds` + `responsavelId` para a function).

**A validar:** "sessão do aluno" é a que tem ele em `leitoresIds`, ou seja, das turmas em que estava matriculado quando a sessão existia. Sessão que o professor nunca abriu, mas cuja janela passou, conta como falta (o check-in é possível em sessão `agendada` dentro da janela, RN08).

---

## 7. Aluno com mais de um vínculo ativo — qual escopo aparece — ✅ RESOLVIDO

- **Nível/XP no Dashboard:** continua somando os pontos de **todos** os escopos e meses do aluno (`listarClassificacoesDoAluno`), um único número de XP pessoal.
- **Tela de Classificação:** com mais de um vínculo ativo, aparece um seletor de escopo (`Abas`) com o nome de cada academia ou professor. Com um vínculo só, a tela continua igual.

---

## 8. `configuracoesGamificacao` e `estruturasFaixas` (RF33) — ✅ RESOLVIDO (pontuação, níveis e faixas)

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

**Estrutura de faixas (rodada de 2026-11-13):**
- **Modelo:**
  - nova coleção `estruturasFaixas/{responsavelId}` com `modalidades: { [modalidade]: [{ id, nome, cor, graus }] }`, na ordem de progressão. Só as modalidades personalizadas aparecem ali; as demais usam a **estrutura padrão**, gerada da lista fixa de antes (`src/utils/faixas.ts`, 4 graus por faixa no Jiu-Jitsu, 0 nas demais);
  - `graduacoes` ganhou `faixaId`, `faixaNome`, `faixaCor` e `grauNumero` (opcionais: a modalidade "Outra" continua em texto livre);
  - `usuarios` ganhou `faixasEstruturadas[modalidade] = { faixaId, faixa, cor, grau, responsavelId }`, escrito pela Cloud Function `aplicarGraduacaoNoPerfil`.
- **Regras:**
  - escrita da estrutura só pelo próprio responsável, com campos fixos e até 20 modalidades. O conteúdo de cada faixa (nome único, cor da paleta, graus de 0 a 10, 1 a 20 faixas) é validado no app, porque Rules não percorre listas (mesmo caso da tabela de níveis);
  - na graduação, os campos novos têm tipo conferido;
  - o aluno não altera `faixasEstruturadas` depois do cadastro (como `faixaOuGrau` e `graduacoes`).
- **Telas:**
  - "Estrutura de faixas" (`EstruturaFaixasScreen`, aberta por "Pontuação e níveis"): por modalidade, ordem (subir e descer), nome, cor (paleta fixa de 10 cores de faixa) e graus. Também permite adicionar, remover e restaurar o padrão;
  - o registro de graduação (RF25) oferece as faixas e os graus da estrutura do responsável. Uma modalidade sem faixas no padrão (ex.: Kickboxing) passa a aceitar graduação se o responsável criar faixas para ela;
  - o Perfil do aluno ganhou a **barra de progresso até a próxima graduação**.

**Decisões tomadas:**
- **(produto, validada pelo autor)** A barra mede os **graus da faixa atual** ("2º grau de 4 · próxima: Roxa · faixa 2 de 5"). Faixa sem graus mostra a barra vazia e a próxima faixa; a última faixa completa fica cheia. É só leitura do que o responsável registrou (RN03), nunca previsão.
- A cor é escolhida numa paleta fixa (as cores que o `SeloFaixa` já desenha), não em hex livre: mantém o contraste nos dois temas.
- O id da faixa é fixo depois de criado. Renomear a faixa não tira o aluno dela; removê-la deixa o aluno só com o texto (sem barra) até a próxima graduação.
- A estrutura usada para o aluno é a de quem registrou a graduação naquela modalidade. Sem graduação registrada, vale a do primeiro responsável com vínculo aceito; sem personalização, a padrão.
- O texto da graduação (`graduacoes`, `faixaOuGrau`) continua sendo gravado e exibido como antes. As outras telas e o `SeloFaixa` não mudaram de fonte.

**Migração do texto livre:** o app casa o texto antigo com a estrutura na hora de mostrar (`resolverGraduacao`: nome da faixa sem acento e sem diferença de maiúscula, o mais longo primeiro, mais o grau escrito no texto). Por isso a barra aparece mesmo sem migrar. `scripts/migrar-faixas.cjs` (dry-run por padrão) grava `faixasEstruturadas` pelo id, para resistir a renomeações, e lista os textos que não casam (ex.: "Kruang 5"). Esses continuam aparecendo só como texto. **Ainda não foi rodado em produção.**

**A validar:**
- o cadastro do aluno continua oferecendo só a estrutura padrão (o aluno ainda não tem responsável nesse momento);
- o aluno com dois responsáveis na mesma modalidade vê a estrutura de quem o graduou por último.

---

## 9. `Alunos` e `Visão consolidada` (RF24, RF27) seguem em `TelaEmBreve`

Confirmado no plano anterior (`docs/PLANO_REGRAS_CICLO2_3.md`): essas duas não precisam de regra nova (dado já desbloqueado), só de função de serviço que componha e da tela — não fizeram parte deste pacote, que ficou restrito a RF16–RF21.

---

## 10. RF23 — público-alvo e vigência das missões — ✅ RESOLVIDO

**Modelo:** `missoes` ganhou `publicoAlvo` (`todos` | `turma` | `alunos`), `turmaId` ou `alunosAlvoIds`, e `vigenciaInicio`/`vigenciaFim` (00:00 do primeiro dia até 00:00 do dia seguinte ao último). Campos só da Cloud Function: `leitoresIds`, `situacao` e `alunosNotificadosIds`. O público é sempre restrito a quem tem vínculo aceito com o responsável.

**Onde a regra vale (não só na tela):**
- **Leitura:** `responsavelId == eu || eu in leitoresIds`. A Cloud Function `missoesPublico.ts` põe em `leitoresIds` o público inteiro na vigência e, fora dela, só quem concluiu. A regra de lista não consegue usar `request.time` (testado, ver `docs/decisoes-tecnicas.md`), por isso o agendamento diário às 00:05 vira a situação das missões.
- **Conclusão manual (personalizada):** a regra de `missoesProgresso` só deixa marcar dentro da vigência e para aluno do público. Desmarcar continua livre.
- **Conclusão automática:** a função de progresso só conta treinos (pelo horário do treino) dentro da vigência e só para alunos do público.
- **RF31:** o aviso de nova missão vai só para o público, quando a missão fica vigente para cada aluno, uma vez por aluno.

**Decisões tomadas:**
- **(produto, validada pelo autor)** Depois do fim da vigência, a missão some da aba "Em curso" e de quem não concluiu, mas quem concluiu continua vendo em "Concluídas".
- Turma = matrícula ativa **agora**: quem se matricula durante a vigência entra no público (e recebe o aviso); quem cancela sai.
- O treino conta pelo horário em que aconteceu: um check-in feito no último dia e validado depois do fim ainda conclui a missão.
- Missão desligada some para quem não concluiu (como antes).
- Público e vigência só são escolhidos na criação; a tela não tem edição de missão (o modelo e a regra já aceitam a edição).
- A vigência pode durar no máximo um ano (366 dias, regra e app).

**Migração:** as missões antigas (sem os campos) valem como `todos`, desde `criadoEm`, sem fim. `scripts/migrar-missoes-publico.cjs` (dry-run por padrão) grava esses valores, e o agendamento diário também as recalcula sozinho na primeira execução. **Até uma das duas coisas acontecer, o aluno não vê as missões antigas**, porque o app passou a consultar por `leitoresIds`. Rodar o script logo depois do deploy.

---

## Redesign "Noite de luta" — decisões tomadas pela opção conservadora

Revisadas no redesign Apple (`docs/REDESIGN_APPLE_RESULTADO.md`): R-02, R-03 e R-08 mudaram; as demais continuam valendo.

### R-01 — Lint não existe no projeto
O pedido de rodar "o lint" ao fim de cada fase não tem alvo: não há ESLint, config nem script `lint` no `package.json`. `npx expo lint` instalaria `eslint` e `eslint-config-expo` e criaria um arquivo de config — dependências fora da lista aprovada (só `expo-haptics`). **Decisão:** não configurar; a verificação por fase é `npx tsc --noEmit` (modo `strict`). **A validar:** aprovar `npx expo lint` numa rodada própria.

### R-02 — `userInterfaceStyle` e `backgroundColor` raiz exigem `expo-system-ui` — ✅ RESOLVIDO
No redesign Apple, `expo-system-ui` foi instalado e o app passou a `userInterfaceStyle: "automatic"`, seguindo a aparência do aparelho. `App.tsx` chama `SystemUI.setBackgroundColorAsync` com o fundo do tema atual, então a view nativa da raiz acompanha claro/escuro nas transições.

### R-03 — Qual é a "medalha de nível máximo" (única em ouro)
`docs/DESIGN.md` reserva o ouro para o 1º do ranking e a "medalha de nível máximo", mas os marcos de `src/config/gamificacao.ts` não têm uma medalha de nível. **Decisão:** a medalha mais alta da progressão principal (`treinos-100`, "100 treinos") é a única marcada como `maxima`. No redesign Apple ela é o único emblema em ouro (`#876000` no claro, `#FFD60A` no escuro); as demais conquistadas ficam no tint. **A validar:** se deve ser outra (ex.: uma medalha nova de "nível 11"), o que exigiria mudar a config de marcos.

### R-04 — Texto da Classificação deixa de dizer "Ranking mensal" — ✅ DESFEITO
Com RN04 implementada (item 4), a tela voltou a dizer "Ranking mensal de {mês}: pontos dos treinos validados neste mês na sua academia ou professor".

### R-05 — Faixa interpretada a partir do texto livre — ✅ RESOLVIDO (RF33)
O `SeloFaixa` deduz cor e graus de `faixaOuGrau`/`graduacao` (texto livre). Desde o RF33 (item 8), ele também recebe `cor` e `graus` da estrutura de faixas do responsável quando a graduação é estruturada (Perfil do aluno, registro de graduação, editor de faixas), e a faixa personalizada (ex.: "Kruang 5" em vermelho) aparece com a cor certa nessas telas. As demais telas que só têm o texto continuam interpretando o texto.

### R-06 — "Meus vínculos" virou "Vincular-se"
A tela aberta por "Meus vínculos" só lista academias/professores para pedir vínculo; não mostra os vínculos existentes (RELATORIO_UI_UX.md, UX-03). Mostrar os existentes exigiria uma consulta nova ao Firestore, fora do escopo (redesign só de apresentação). **Decisão:** renomear o item e o título da tela para "Vincular-se". O estado "Enviado" continua local à tela. **A validar:** criar uma tela real de "Meus vínculos" (com pendentes e aceitos) numa rodada de funcionalidade.

### R-07 — Home do Aluno sem o nome do professor no hero
O HeroCheckIn aceita `professor`, mas a Home não buscava o professor de cada sessão (a Agenda busca). Buscar exigiria uma chamada nova ao Firestore na Home. **Decisão:** a Home não mostra o professor; a Agenda mostra. **A validar:** se vale a leitura extra.

### R-08 — "Encerrar sessão" sem confirmação — ✅ RESOLVIDO
No redesign Apple, "Encerrar sessão" virou botão destrutivo e pede confirmação no alerta do sistema ("O check-in fecha para todos os alunos e a sessão não pode ser reaberta."). A chamada ao serviço é a mesma; só ganhou o passo de confirmação.

### R-09 — Conquistas: medalha de graduação fora da detecção
O `useConquistas` só detecta medalhas de treinos e de sequência. A de "Primeira graduação" depende de `graduacoes`, que a Home não lê; ler exigiria uma consulta nova ao Firestore. A subida de faixa em si é detectada (pelo `usuario.faixaOuGrau`). **A validar:** se vale adicionar a leitura de graduações na Home.

### R-10 — Conquistas detectadas por aparelho
O "último estado" fica no AsyncStorage do aparelho: num aparelho novo, a primeira abertura só grava (não celebra), e o mesmo aluno em dois aparelhos pode ver a mesma conquista duas vezes. Persistir no Firebase resolveria, mas o pedido foi não gravar nada lá. **A validar:** se isso basta.
