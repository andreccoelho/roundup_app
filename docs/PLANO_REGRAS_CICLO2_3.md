# Plano — liberar Ciclo 2 / parte do Ciclo 3 em firestore.rules

Antes do Passo 4. Sem alterar `firestore.rules` ainda — só leitura do estado atual (`firestore.rules`, `docs/decisoes-tecnicas.md`) e dos services em `src/services/`, cruzados com `docs/requisitos/requisitos-v1-2026-09.csv`.

---

## 0. Achado que muda o escopo do pedido

O pedido era liberar backend para que **Missões, Classificação, Alunos e Visão consolidada** saiam de `TelaEmBreve`. Depois de ler os 12 arquivos em `src/services/` e `src/types/index.ts` inteiro, isso se divide em três situações bem diferentes:

| Aba | Precisa de regra nova? | Por quê |
|---|---|---|
| **Alunos** (RF24) | **Não** | `matriculas` e `checkins` já estão desbloqueados e já legíveis pelo responsável (`responsavelId == meuId()`). Falta só uma função de serviço que combine as duas (não existe hoje) e a tela — trabalho de Passo 4, não de regra. |
| **Visão consolidada** (RF27) | **Não**, para o que já é dado hoje | Mesma base de `academia/DashboardScreen.tsx` (turmas/vínculos), já lida sem restrição nova. "Indicadores agregados de frequência" especificamente depende de somar `checkins` por período — dado aberto, falta a função de agregação, não a regra. |
| **Missões** (RF18, RF23) | **Sim** | `missoes` e `missoesProgresso` têm serviço pronto (`src/services/missoes.ts`) e estão bloqueadas (`allow read, write: if false`). Ver seção 2. |
| **Classificação** (RF20) | **Não existe o que liberar** | Não há coleção, tipo nem serviço de ranking/pontuação agregada em lugar nenhum do repositório. Ver seção 4 — isso não é uma regra a escrever, é uma feature a desenhar antes. |

Ou seja: **2 das 4 abas do pedido não dependem de `firestore.rules` nenhuma** — dependem de composição de serviço e tela (Passo 4). Das outras duas, uma (Missões) tem tudo pronto para liberar regra; a outra (Classificação) não tem onde pendurar uma regra hoje.

---

## 1. O que já existe em `firestore.rules`

**Helpers:**
- `autenticado()`, `meuId()`, `dadosUsuario(uid)`, `meuPerfil()`, `souAluno()`, `souGestor()` — primitivas de identidade/perfil.
- `tipoBateComPerfis()` — só para `vinculos.create`: confere que `tipo` gravado bate com os perfis reais de `solicitanteId`/`destinatarioId` lidos em `usuarios/{uid}`.
- `tenhoVinculoAtivoCom(outroId)` — lê `usuarios/{meuId()}/privado/vinculos.responsaveisIds`; **só segura em escrita de documento único** (`matriculas.create`, `sessoes.update`), nunca em regra de leitura usada por `getDocs(query(...))` (limitação documentada: `get()`/`exists()` + `resource.data` no mesmo `&&` quebra a avaliação de `list`).
- `souDestinatarioDeVinculoAceito(solicitanteId)` — usa `getAfter()`/`existsAfter()` porque a escrita no documento privado acontece na mesma transação que aceita o vínculo.
- `souAdicionadoAosLeitores()` / `souRemovidoDosLeitores()` — provam que uma mudança em `leitoresIds` é exatamente "+1 o próprio uid" ou "-1 o próprio uid", puramente sobre `resource.data`/`request.resource.data` (seguro para `list`).
- `janelaCheckInValida(sessaoId)` — 1 `get()` de sessão, usado só em `checkins.create`.
- `matriculadoEm(turmaId)` — `exists()` por ID determinístico (`turmaId_meuId()`), usado só em `checkins.create`.

**Coleções com regra real:**
- `usuarios/{usuarioId}` — leitura ampla (autenticado); criação só o próprio dono; update do próprio perfil OU do campo `autonomo` pelo destinatário de um vínculo professor-academia recém-aceito; delete sempre falso (RF29 é Ciclo 4).
- `usuarios/{usuarioId}/privado/{doc}` — leitura só do dono; escrita do dono OU do destinatário de vínculo aceito (contrapartida de `responderSolicitacao()`).
- `vinculos/{vinculoId}` — leitura só para quem é solicitante ou destinatário; create com `tipoBateComPerfis()` + `status == 'pendente'`; update (aceite/recusa) só pelo destinatário; delete sempre falso.
- `turmas/{turmaId}` — leitura ampla para turmas ativas (limitação assumida: checagem cruzada de vínculo é impossível em `list`, documentado) + leitura do próprio responsável/professor para turmas inativas; create/update só do responsável; delete sempre falso (soft delete).
- `matriculas/{matriculaId}` — leitura para aluno ou responsável da matrícula; create só pelo próprio aluno, com `tenhoVinculoAtivoCom()`; update para aluno ou responsável; delete sempre falso.
- `sessoes/{sessaoId}` — leitura via `leitoresIds` (desnormalizado, sincronizado por Cloud Function em `functions/src/index.ts`, não pelo client); create pelo responsável/professor da turma; update pelo responsável/professor OU auto-(des)adição do aluno em `leitoresIds`; delete sempre falso.
- `checkins/{checkinId}` — leitura para aluno ou responsável (com guarda `resource == null` para o caso "ainda não existe"); create só pelo próprio aluno, com `matriculadoEm()` + `janelaCheckInValida()`, ID determinístico garante RN02; update só pelo responsável (é aqui que RF22/validação acontece); delete sempre falso.
- `consentimentosLGPD/{doc}` — leitura/criação só pelo próprio dono; update/delete sempre falso (registro de auditoria imutável).
- **Bloqueadas explicitamente hoje:** `missoes`, `missoesProgresso`, `graduacoes`, `configuracoesGamificacao` — `allow read, write: if false`.
- Negação padrão para qualquer coleção não declarada.

---

## 2. Padrão esperado pelas coleções pendentes com serviço real

### `missoes` — `src/services/missoes.ts:15-36`

Serviço já pronto: `criarMissao`, `buscarMissao`, `atualizarMissao`, `removerMissao`, `listarMissoesPorResponsavel(responsavelId)`.

- **Escreve:** só o `responsavelId` dono da missão (professor autônomo ou academia) — mesmo padrão de `turmas.create`/`update` (`souGestor() && request.resource.data.responsavelId == meuId()`).
- **Lê hoje, no serviço:** só `listarMissoesPorResponsavel` — usado pelo próprio gestor para gerenciar. **Não existe nenhuma função de leitura para o aluno** (ex.: "missões ativas do meu responsável"). RF18 exige isso; a função mais próxima é a mesma `listarMissoesPorResponsavel`, só que chamada pelo aluno passando o `responsavelId` do vínculo dele — tecnicamente reutilizável sem mudar o service, mas a regra de leitura atual (se copiada de `turmas`) precisaria ser `resource.data.get('ativa', false) == true || resource.data.get('responsavelId','') == meuId()` — aberta a qualquer autenticado para missões ativas, exatamente como turmas ativas. É a mesma limitação de `list` + vínculo cruzado (documentada), resolvida do mesmo jeito que turmas: abrir leitura de missão ativa a qualquer autenticado (dado não sensível: título, descrição, meta, pontos, responsável). Diferente de turmas, hoje **nenhuma tela ou função de serviço lê isso do lado do aluno** — teria que ser escrita no Passo 4.

### `missoesProgresso` — `src/services/missoes.ts:40-70`

Serviço pronto: `criarProgresso`, `buscarProgresso`, `atualizarProgresso`, `removerProgresso`, `listarProgressoPorAluno(alunoId)`, `listarProgressoPorMissao(missaoId)`.

- **Lê:** o próprio aluno (`alunoId == meuId()`) e o responsável da missão correspondente — mas a regra não pode fazer `get()` na missão para achar o `responsavelId` dentro de uma regra de `list` (mesma limitação). Solução: desnormalizar `responsavelId` também em `missoesProgresso` no momento da escrita (o service já teria essa informação disponível, já que quem cria o progresso sabe de qual missão/responsável se trata) — aí a leitura do gestor vira `resource.data.get('responsavelId','') == meuId()`, puramente `resource.data`, seguro para `list`.
- **Escreve:** aqui está a pergunta em aberto — ver seção 6, item 1. O service aceita qualquer `MissaoProgresso`/`Partial<MissaoProgresso>`, sem indicar quem chama.

### `graduacoes` — `src/services/graduacoes.ts`

Serviço pronto: `criarGraduacao`, `buscarGraduacao`, `atualizarGraduacao`, `removerGraduacao`, `listarGraduacoesPorAluno(alunoId)`.

- **Escreve:** só o `responsavelId` (RN03 — ver seção 3). `create` deveria também confirmar que `alunoId` é alguém com quem esse responsável tem relação de fato (matrícula ou vínculo aceito), não qualquer uid — ver função proposta na seção 5.
- **Lê:** aluno da própria graduação (`alunoId == meuId()`) ou o responsável que a concedeu (`responsavelId == meuId()`) — os dois são campos de `resource.data`, seguro para `list`, mesmo padrão de `checkins`/`matriculas`.
- **update/delete:** o service expõe as duas, mas nada obriga a regra a permitir — ver seção 6, item 2 (histórico devia ser imutável?).

### `configuracoesGamificacao` — `src/services/configuracoesGamificacao.ts`

Serviço pronto: `criarConfiguracao`, `buscarConfiguracao`, `atualizarConfiguracao`, `removerConfiguracao`, `buscarConfiguracaoPorResponsavel(responsavelId)`.

- **Escreve:** só o `responsavelId` dono da configuração — mesmo padrão de `turmas`.
- **Lê:** o próprio responsável certamente; alunos do escopo dele, talvez — nenhuma função de serviço hoje chama isso do lado do aluno. Se abrir, mesma solução de `turmas`/`missoes`: leitura ampla a qualquer autenticado (não é dado sensível, é "regra do jogo" pública).
- **Ressalva prática:** essa coleção configura um processo de crédito de pontos (`pontosPorCheckin`, `pontosPorMissao`, `pontosPorGraduacao`) que **não existe em código nenhum lugar** — ver seção 4. Liberar a regra é possível (o service existe), mas ela fica sem efeito prático até RF16 existir.

---

## 3. Mapeamento das regras de negócio

### RN01 — pontuação só após check-in validado

**Já está garantido, sem nenhuma mudança de regra.** `checkins.pontos` já é um campo do documento (`types/index.ts:109`, hoje sempre `0`); a regra de `checkins.update` (`resource.data.responsavelId == meuId()`) já restringe **qualquer** alteração de campo — inclusive `pontos` — ao responsável da sessão. O aluno, dono do `create`, nunca pode fazer `update` (a regra de `create` e a de `update` são mutuamente exclusivas por dono). O que falta para RN01 "funcionar de verdade" é puramente RF16: nenhum código hoje escreve um valor de `pontos` diferente de `0` em `validarCheckIn()` (`src/services/checkins.ts:102-112`). Isso é trabalho de serviço/Ciclo 2, não de `firestore.rules`.

### RN03 — graduação é decisão humana, nunca automática

Mapeia para `graduacoes.create`: a regra garante **quem** pode escrever (`souGestor() && responsavelId == meuId()`, nenhum outro caminho de escrita existe — sem Cloud Function, sem trigger algorítmico). Isso é necessário mas não suficiente: a regra não consegue provar "um humano clicou o botão" — isso é garantia do Passo 4 (a tela de registro de graduação não pode nunca disparar `criarGraduacao()` a partir de um cálculo automático de pontos). Registro para não perder de vista quando chegarmos lá.

### RN04 — janela temporal da classificação

**Não há regra para mapear.** RN04 protege uma consulta de classificação que não existe (nenhuma coleção, nenhum service). Ver seção 4.

### RN09 — escopo da classificação segue o vínculo

Mesma resposta de RN04: **não há coleção nem service de classificação hoje.** Respondendo à pergunta direta — "isso é regra de leitura filtrada ou o client filtra e a regra só garante isolamento de escopo?" — **nenhuma das duas ainda**, porque não existe consulta nenhuma para filtrar. Se/quando essa feature for desenhada, a resposta técnica antecipada é: **teria que ser regra de leitura filtrada**, não confiança no client, pelo mesmo motivo que `sessoes` não confia no client — client-side filtering só esconde a UI, não impede um `getDocs` direto lendo dados de fora do escopo. E qualquer solução esbarra na mesma limitação de `list` + `get()`/`exists()` cruzado já documentada — provavelmente exigindo um índice desnormalizado por escopo (tipo `leitoresIds` de sessões), mantido por Cloud Function, não pelo client.

---

## 4. RFs de Ciclo 2/3 sem serviço de dados — não vou escrever regra para eles

Busquei `xp|nivel|pontos|sequencia|medalha|classificacao|ranking` em `src/types/index.ts` e `src/services/`. Resultado:

- **RF16 (crédito de XP), RF17 (nível e progresso), RF19 (medalhas), RF20 (classificação), RF21 (sequência de treinos)** — **nenhum tipo, nenhuma coleção, nenhum service.** `Usuario` não tem campo de pontos/nível/sequência; não existe `Medalha`/`Conquista` em `types/index.ts`; `TipoMissao` inclui o valor `'sequencia'` como categoria de missão, mas isso não é um contador de sequência do aluno. Não vou propor regra para nenhuma coleção dessas — não existe onde pendurar.
- **RF24 (alunos com frequência), RF26 (relatório de frequência), RF27 (visão consolidada)** — dado-fonte (`matriculas`, `checkins`, `turmas`) já desbloqueado e já lido pelo responsável certo; falta função de serviço que componha (soma/agrupa), não regra nova.
- **RF18 (progresso de missões), RF23 (missões)** — únicos dois RFs de Ciclo 2/3 gamificação com service pronto e pendente só de regra. Cobertos na seção 2.
- **RF25 (graduação), RF33 (configuração de pontuação/graduação)** — também com service pronto, cobertos na seção 2.

---

## 5. `tipoBateComPerfis()` estendida, ou função equivalente

`tipoBateComPerfis()` resolve um problema específico de `vinculos`: confirmar que um campo `tipo` (enum) bate com os perfis reais de dois usuários referenciados. Nenhuma das quatro coleções pendentes tem esse formato — `Missao.tipo` é só uma categoria escolhida livremente pelo gestor (`'presenca' | 'pontuacao' | 'sequencia' | 'personalizada'`), sem relação com perfil de ninguém. **Não proponho estender `tipoBateComPerfis()`.**

O que encontrei faltando, ao analisar as seções 2 e 3, é outra coisa: uma função para `graduacoes.create` (e possivelmente `missoesProgresso`, dependendo da decisão do item 1 da seção 6) confirmar que o `alunoId` gravado é alguém com quem o gestor que está escrevendo **de fato** tem relação — hoje não existe essa checagem para nenhuma coleção onde o gestor escreve um documento *sobre* um aluno (diferente de `matriculas`/`checkins`, onde é sempre o aluno escrevendo sobre si mesmo). Proposta, mesmo padrão de `tenhoVinculoAtivoCom()` mas na direção inversa (checa o documento privado do **aluno**, não o meu):

```
// Inversa de tenhoVinculoAtivoCom(): usada quando o GESTOR escreve um documento sobre um
// aluno (graduacoes.create), para confirmar que o aluno realmente tem esse gestor como
// responsável aceito — em vez de qualquer uid solto no campo alunoId.
function souResponsavelDoAluno(alunoId) {
  return exists(/databases/$(database)/documents/usuarios/$(alunoId)/privado/vinculos)
    && meuId() in get(/databases/$(database)/documents/usuarios/$(alunoId)/privado/vinculos).data.get('responsaveisIds', []);
}
```

Segura pelo mesmo motivo que `tenhoVinculoAtivoCom()` é segura: usada em escrita de documento único (`graduacoes.create`), não em `list`; `get()`/`exists()` dentro da regra não passam pela regra de leitura do documento privado (que está fechado a terceiros).

---

## 6. Pendências para sua decisão antes de eu tocar em `firestore.rules`

1. **Quem escreve `missoesProgresso`?** O aluno se autodeclarando (arriscado pelo mesmo espírito de RN01 — progresso auto-reportado é tão "driblável" quanto pontos auto-creditados) ou só o responsável (mesmo padrão de `checkins`: aluno gera o evento bruto — aqui, os check-ins que compõem o progresso —, responsável credita)? Recomendo a segunda opção por consistência com RN01, mas é uma decisão de produto, não só técnica.
2. **`graduacoes` update/delete:** histórico imutável depois de criado (como `consentimentosLGPD`) ou o responsável pode corrigir um lançamento errado? Isso muda a regra de `update`/`delete`.
3. **Confirma `souResponsavelDoAluno()` proposta na seção 5** para `graduacoes.create` (e para `missoesProgresso`, se a resposta do item 1 for "o responsável escreve")?
4. **Classificação (RF20) fica de fora desta rodada de regras**, por não ter onde pendurar — correto assumir isso e seguir sem ela, deixando a aba em `TelaEmBreve` mais uma rodada? Ou você quer que eu desenhe a feature (tipo + service + índice desnormalizado) antes, como um projeto à parte deste plano?
5. **Alunos (RF24) e Visão consolidada (RF27) não precisam de regra nova** — confirma que isso vira trabalho de serviço/tela (Passo 4 antecipado, ou Passo 4 na ordem normal), sem mexer em `firestore.rules` para essas duas?

Aguardo seu aval item por item antes de tocar em `firestore.rules`.
