# Decisões pendentes de validação — Ciclo 2 / parte do Ciclo 3

Lista de checagem para revisão com a orientadora antes da entrega do TCC. Toda decisão aqui foi tomada pela opção **mais simples de implementar**, não a mais debatida, para destravar a construção e o teste da interface agora — não são recomendações de produto finais.

---

## Bloqueios de backend — resolver antes da entrega final

Diferente da lista numerada abaixo (decisões de **métrica/produto** de gamificação, ajustáveis por número), isto é um **bloqueio de funcionalidade**: sem isso, RF29 não funciona de verdade em produção, independente de qualquer decisão de produto.

### RF29 — exclusão de conta: falta limpeza em cascata

A tela (`src/screens/compartilhado/ExcluirContaSecao.tsx`) e a chamada (`AuthContext.excluirConta()`) são reais e a UI já trata a falha de forma legível (`Aviso` com a mensagem fixa "Não foi possível excluir sua conta agora.", nunca o texto técnico do Firebase). Mas a chamada real **falha hoje por dois motivos empilhados**, não só um:

1. **`firestore.rules` nega `usuarios.delete` incondicionalmente** (`allow delete: if false`) — o mais simples de corrigir, é só mudar a condição.
2. **Mesmo que a regra abrisse, apagar só `usuarios/{uid}` deixaria dado órfão**: `usuarios/{uid}/privado/vinculos`, `matriculas`, `checkins`, `vinculos`, `graduacoes`, `classificacoes` — todos têm o uid do dono espalhado, sem nenhum gatilho de limpeza em cascata hoje. Abrir só a regra sem resolver isso apagaria a conta mas deixaria o rastro de dados pessoais no banco, o oposto do que a LGPD (RF29 é sobre isso) exige.

**Não implementado nesta sessão, de propósito — é trabalho de backend fora do escopo desta rodada de UI.** A solução mais provável é uma Cloud Function (Admin SDK, mesmo padrão já usado no projeto para sincronizar `leitoresIds` em `functions/src/index.ts`) disparada por um pedido de exclusão, que apaga em cascata e só então libera a exclusão do documento raiz — ou uma exclusão em duas fases (marca para exclusão, um processo de backend confirma depois). Qualquer uma das duas é decisão de arquitetura de backend, não de interface.

---

## 1. Valores de gamificação (`src/config/gamificacao.ts`)

- **RF16** — `XP_POR_CHECKIN_VALIDADO = 10`: quantidade arbitrária, sem nenhuma pesquisa de balanceamento por trás.
- **RF17** — tabela de níveis `NIVEIS_XP`: progressão provisória em +50 por degrau (100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250), 10 níveis. Sem base em literatura de gamificação nem teste com usuário.
- **RF19** — marcos de medalha (`MARCOS_MEDALHAS`): 6 marcos (10/30/100 treinos, 7/30 dias de sequência, 1ª graduação), números escolhidos sem validação.
- **RF20/RN04** — `JANELA_RANKING = 'mensal'`: hoje é só rótulo de texto na UI. **A classificação não reseta pontos por período** — é cumulativa desde o primeiro check-in validado. RN04 ("classificação considera apenas os pontos obtidos no período vigente") **não está implementada**.

**Decisão a validar:** esses números viram config real (painel de configuração, RF33) ou continuam fixos no código?

---

## 2. `missoesProgresso` — quem escreve (RF18)

**Decidido:** só o responsável (professor/academia) cria e atualiza o progresso do aluno em uma missão — nunca o aluno. Mesmo espírito de RN01 (pontuação só após validação humana): progresso autodeclarado pelo aluno seria tão "driblável" quanto pontos autocreditados.

**Consequência prática:** hoje **nenhuma tela escreve `missoesProgresso`** — a tela de criação/gestão de missões (RF23) ainda não foi construída (é Ciclo 3), então o progresso do aluno aparece vazio ("0 de X") até essa tela existir. A leitura (RF18, aluno vê progresso) já funciona.

**Decisão a validar:** confirma que o responsável marca progresso manualmente (ex.: ao validar um check-in que conta para uma missão de "presença"), ou isso devia ser automático a partir dos check-ins validados? Automatizar exigiria lógica adicional (cliente ou Cloud Function) não escrita nesta rodada.

---

## 3. `graduacoes` — histórico imutável (RF25, RN03)

**Decidido:** depois de criada, uma graduação não pode ser editada nem apagada (`allow update, delete: if false`, mesmo padrão de `consentimentosLGPD`) — opção mais simples, em vez de permitir ao responsável corrigir um lançamento errado.

**Decisão a validar:** um erro de digitação (ex.: grau errado) fica permanente no histórico, corrigível só por um novo lançamento posterior explicando a correção? Ou precisa de um caminho de correção?

---

## 4. `classificacoes` — modelo de dados e leitura (RF20, RN04, RN09)

**Modelo escolhido:** coleção nova `classificacoes/{alunoId}_{responsavelId}` (um documento por par aluno/responsável), em vez de campo direto em `usuarios` — decisão pela opção que exige menos mudança na regra já existente e delicada de `usuarios`, e porque um aluno pode ter mais de um vínculo aceito (mais de um documento, um por escopo), o que um único campo em `usuarios` não representaria bem.

**RN09 (escopo segue o vínculo) — como está garantida:** só pelo filtro que o client aplica na consulta (`where('responsavelId','==', escopo)`), **não pela regra de leitura**, que é aberta a qualquer autenticado (`allow read: if autenticado()`), mesmo padrão já aceito neste projeto para turmas ativas e para missões ativas — a checagem cruzada "este usuário tem vínculo com este `responsavelId`" é comprovadamente impossível dentro de uma regra usada por `getDocs(query(...))` (ver `docs/decisoes-tecnicas.md`). Consequência: **qualquer usuário autenticado pode, tecnicamente, consultar a classificação de qualquer escopo** (de qualquer academia/professor) diretamente pela API do Firestore, ainda que a UI nunca ofereça esse caminho. É a mesma exposição que turmas ativas já tem hoje.

**RNF11 (adesão opcional à classificação) — não está implementada.** Não existe campo de opt-in/opt-out em `Usuario` nem em `Classificacao`; todo aluno aparece na classificação do seu escopo sempre que tem pontos.

**RN04 (janela de tempo) — não está implementada**, ver item 1.

**Decisão a validar:**
1. A exposição de leitura ampla descrita acima é aceitável para a entrega do TCC, ou precisa de um índice desnormalizado por escopo (tipo `leitoresIds` de sessões, mantido por Cloud Function) antes?
2. RNF11 (opt-in) entra nesta rodada ou fica para depois — e, se entrar, o aluno some da lista dos outros ou só deixa de ver a própria posição?
3. RN04 (janela mensal de verdade, com reset) entra nesta rodada ou fica documentado como pendência?

---

## 5. RF19 — medalhas sem coleção persistida

Medalhas são calculadas ao vivo (`src/utils/gamificacao.ts`, `calcularMedalhas()`) a partir de contagens que o aluno já pode ler (check-ins validados, sequência atual, total de graduações) — **não há registro de quando uma medalha foi conquistada, nem notificação de nova conquista** (RF31, notificações, é Ciclo 4 e nem está desenhado ainda).

**Decisão a validar:** isso é suficiente para o Ciclo 2, ou medalha precisa de um registro persistido (data de conquista, e futuramente notificação)?

---

## 6. RF21 — sequência conta dias, não sessões

`calcularSequencia()` conta **dias consecutivos com ao menos um check-in validado**, não sessões consecutivas — um aluno que treina 2x no mesmo dia soma 1 dia de sequência, não 2. Também não distingue "faltou porque a academia não teve aula naquele dia" de "faltou porque o aluno não foi": qualquer dia sem check-in validado quebra a sequência, mesmo sem sessão agendada.

**Decisão a validar:** sequência por dia civil está correto, ou deveria ser por sessão agendada (só quebra se houve sessão e o aluno não foi)?

---

## 7. Aluno com mais de um vínculo ativo — qual escopo aparece

RN05 permite (e a modelagem de `matriculas`/`vinculos` não impede) um aluno ter vínculo ativo com mais de um responsável. As telas novas (Classificação, nível no Dashboard) tratam isso de dois jeitos diferentes, sem UI para escolher escopo:
- **Nível/XP no Dashboard:** soma os pontos de **todos** os escopos do aluno (`listarClassificacoesDoAluno`) — um único número de XP pessoal, faz sentido não ser por escopo.
- **Tela de Classificação:** usa só o **primeiro** responsável retornado por `listarResponsaveisAtivosDoAluno` — sem seletor de escopo. Um aluno vinculado a duas academias só vê o ranking da primeira.

**Decisão a validar:** a tela de Classificação precisa de um seletor de escopo (abas/dropdown) antes da entrega, ou "primeiro vínculo" é aceitável para o Ciclo 2?

---

## 8. `configuracoesGamificacao` (RF33) continua bloqueada

Não desbloqueei essa coleção nesta rodada — nenhum código lê ou escreve nela; `src/config/gamificacao.ts` usa valores fixos no lugar. RF33 "de verdade" é trocar o arquivo fixo por essa coleção (painel de configuração do responsável), que não foi construído.

---

## 9. `Alunos` e `Visão consolidada` (RF24, RF27) seguem em `TelaEmBreve`

Confirmado no plano anterior (`docs/PLANO_REGRAS_CICLO2_3.md`): essas duas não precisam de regra nova (dado já desbloqueado), só de função de serviço que componha e da tela — não fizeram parte deste pacote, que ficou restrito a RF16–RF21.
