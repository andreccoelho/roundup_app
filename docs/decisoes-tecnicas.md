# Decisões técnicas — limitações conhecidas

## 2026-09-08 — get()/exists() com resource.data é incompatível com regras de lista

**Descoberta**: uma rodada anterior assumia que o único problema de `get()`/`exists()` em
regras de leitura era o limite de 10 chamadas por consulta, e que chamadas repetidas ao mesmo
caminho seriam cacheadas entre documentos diferentes de uma mesma consulta. A suíte de testes
no emulador (`tests/rules/`) provou as duas coisas erradas:

1. **Não há cache entre documentos** de uma mesma consulta — só dentro da avaliação de UM
   documento. Um `get()` ao mesmo caminho fixo, repetido para os N documentos retornados por
   uma consulta, custa N chamadas, não 1.
2. **Combinar `get()`/`exists()` com `resource.data` dentro do mesmo `&&` (ou da mesma função,
   mesmo passando o valor por parâmetro, ou lendo `resource.data` direto no corpo dela) lança
   `evaluation error` quando a regra é avaliada para uma consulta de lista (`list`)** — mesmo
   com uma única chamada, bem abaixo do limite de 10. Em `get()` de documento único ou em
   `create`/`update` (que usam `request.resource.data`), a mesma combinação funciona
   normalmente — a restrição é específica de `list`.

Uma rodada seguinte aprofundou o item 2: **o Firestore prova a segurança de uma consulta pelo
FORMATO do filtro (`where`/`orderBy`), não pelos dados que ela de fato retornaria.** Uma
consulta filtrada por `turmaId == X` nunca pode ser provada segura pela regra
`meuId() in resource.data.leitoresIds`, mesmo que, na prática, todo documento retornado já
contenha `meuId()` em `leitoresIds` — o motor de regras nega a consulta inteira porque não
consegue garantir isso para *qualquer* documento que pudesse casar com o filtro, não só os que
casam hoje. Só uma consulta filtrada pelo MESMO campo que a regra usa (`leitoresIds`
`array-contains` `meuId()`) é provável — ver a entrada "leitoresIds em sessões" abaixo para a
consequência prática disso.

**Consequência prática (item 2 original)**: é estruturalmente impossível, nas regras usadas
por `getDocs(query(...))`, checar "este usuário tem vínculo aceito com o `responsavelId` deste
documento" ou "este usuário está matriculado nesta `turmaId`" — qualquer checagem cruzada de
coleção que dependa de um campo do documento sendo listado quebra a consulta inteira.

**Decisão (turmas — ainda vale, não mudou nesta rodada)**: turmas **ativas** ficam legíveis
por qualquer autenticado (mesmo padrão já usado em `usuarios`, "leitura ampla necessária para
descoberta") — é o que viabiliza RF08 (aluno descobre turmas antes de ter vínculo). Turmas
inativas continuam restritas ao responsável, já que esse campo não depende de lookup nenhum.
Metadado de turma (nome, modalidade, nível) fica legível por qualquer usuário autenticado, não
só da mesma academia — mais amplo do que RNF04 idealmente permitiria, mas dano baixo (não é
dado pessoal). **A leitura de `sessoes` NÃO segue mais esse padrão** — ver entrada própria
abaixo; o que era limitação assumida para sessões virou decisão de projeto com `leitoresIds`.

**Alternativas descartadas para turmas**:
- Manter a checagem cruzada de coleção (vínculo) na regra de leitura: provado impossível para
  consultas de lista neste motor de regras, não é uma questão de otimizar custo.
- Custom claims no token de autenticação (sem `get()`): exigiria uma Cloud Function disparada
  por mudança em `vinculos` para atualizar claims — infraestrutura de backend que este projeto
  não tem hoje.

## 2026-09-09 — `usuarios/{uid}/privado/vinculos`: vínculos ativos saem do documento raiz

Consequência da descoberta acima, mas por um motivo diferente: `vinculosAtivos` tinha sido
desnormalizado como array em `usuarios/{uid}` (documento raiz) numa rodada anterior, para que
`matriculas.create` pudesse checar "tenho vínculo ativo com X" sem consulta de lista. Só que
`usuarios/{uid}` raiz tem `allow read: if autenticado()` (leitura ampla, necessária para
descoberta de academias/professores) — qualquer usuário autenticado conseguia reconstruir o
grafo institucional inteiro do sistema (quem se vincula a quem), o que viola RNF04 do mesmo
jeito que a exceção de leitura de `vinculos` removida numa rodada anterior.

**Decisão**: o array virou `responsaveisIds` num documento **separado**,
`usuarios/{uid}/privado/vinculos`, com leitura fechada a qualquer um exceto o próprio dono
(`allow read: if usuarioId == meuId()`). Isso funciona porque **`get()`/`exists()` dentro de
`firestore.rules` não passam pelas próprias regras de leitura** — um documento pode estar
fechado para clientes e ainda ser lido por uma regra. `tenhoVinculoAtivoCom()` (usada só em
escritas de documento único: `matriculas.create`, `sessoes.update` de autoadição/remoção do
aluno) continua funcionando sem mudança de comportamento visível.

**Escrita do documento privado — quem escreve o quê**: `responderSolicitacao()` roda como o
**destinatário** do vínculo (quem aceita), escrevendo no documento privado do **solicitante**
(dono diferente de quem executa a escrita). Uma regra "só o dono escreve o próprio privado"
quebraria isso — foi cogitada e descartada, porque a única alternativa seria mover a escrita
para uma Cloud Function (fora do escopo do Ciclo 1, ver "O que não fazer"). A regra libera a
escrita também para o destinatário de um vínculo aceito com o dono do documento (mesmo padrão
já usado para `autonomo` em `usuarios` raiz).

**Achado colateral (`getAfter()`/`existsAfter()`)**: a checagem "vínculo está aceito" para
autorizar essa escrita não pode usar `get()`/`exists()` comuns, porque `responderSolicitacao()`
muda o status do vínculo para `'aceito'` **na mesma transação** em que grava o documento
privado — um `get()` normal só enxerga o estado *antes* da transação (ainda `'pendente'`) e
negaria a escrita. `getAfter()`/`existsAfter()` enxergam o estado que a própria transação está
prestes a gravar. Isso vale igualmente para a regra já existente de `autonomo` em `usuarios`
raiz, que tinha o mesmo problema (não coberto por nenhum teste até agora) — corrigido junto.
`tests/rules/usuarios.test.ts` tem um teste que reproduz a transação real (vínculo + documento
privado juntos) para não deixar essa combinação sem cobertura de novo.

## 2026-09-09 — `leitoresIds` em sessões: de limitação assumida a decisão de projeto

A rodada anterior deixou `sessoes` com `allow read: if autenticado()` (qualquer autenticado
lê), documentado como limitação assumida — sessão expõe agenda operacional (quem treina, onde,
quando), dado pessoal sob a LGPD, diferente do metadado de turma. Essa exposição foi corrigida
nesta rodada com um array `leitoresIds` desnormalizado na própria sessão: a regra de leitura
virou `meuId() in resource.data.get('leitoresIds', [])`, puramente `resource.data`, sem
`get()` nenhum — prova estaticamente segura para `getDocs(query(...))` por construção, ao
contrário de checar vínculo ou matrícula por lookup cruzado (impossível, ver entrada acima).

`criarSessao` inicializa `leitoresIds` com o responsável, o professor e os alunos já
matriculados na turma no momento da criação. A partir daí, o array precisa ser mantido em
sincronia sempre que uma matrícula nasce, é cancelada ou é reativada.

**Paradoxo de ordem, sem solução no client (descoberto ao testar a sincronização)**:
adicionar o aluno a `leitoresIds` das sessões futuras *já existentes* da turma exige uma
consulta para encontrá-las (`where('turmaId', '==', turmaId)`) — mas essa consulta só é
provada segura pelo Firestore se o filtro corresponder ao que a regra de leitura exige (ver a
nota sobre "prova pelo formato do filtro" na primeira entrada deste documento), e o filtro por
`turmaId` não corresponde a `leitoresIds array-contains meuId()`. Só dá pra encontrar, do lado
do client, sessões em que o aluno **já é leitor** — que é exatamente o que ele ainda não é, no
momento em que acabou de se matricular. Remover (`cancelarMatricula`) não tem esse problema, o
aluno que está saindo já é leitor de tudo que precisa encontrar — mas fica estranho ter a
sincronização pela metade no client e a outra metade em outro lugar.

**Decisão**: a sincronização de `leitoresIds` na (des)matrícula saiu inteiramente do client e
virou responsabilidade de duas Cloud Functions com Admin SDK
(`functions/src/index.ts`, `sincronizarLeitorNaMatricula` e
`sincronizarLeitorNaAtualizacaoDeMatricula`), disparadas por gatilho do Firestore
(`onDocumentCreated`/`onDocumentUpdated` em `matriculas/{matriculaId}`). O Admin SDK **ignora
`firestore.rules`** — não existe "consulta que precisa ser provada segura" para ele, porque ele
não está sujeito a regra nenhuma. Isso resolve o paradoxo de vez: a function lê `sessoes` por
`turmaId` livremente, sem precisar que o aluno já seja leitor de nada.

`src/services/matriculas.ts` voltou a ser só criação/atualização do documento de matrícula —
não chama mais nenhuma sincronização. `firestore.rules` não mudou nesta rodada (o problema era
de fluxo de escrita, não de regra); a permissão de autoadição/remoção em `leitoresIds` que
existia para o client tentar sincronizar sozinho continua na regra (não foi pedido remover) mas
não é mais usada por nenhum código do app — `tests/rules/sessoes.test.ts` documenta isso e
testa essa permissão diretamente, sem depender de um service que não existe mais.

A função cobre as duas direções que uma mudança de status em `matriculas` pode ter (`'ativa'`
→ adiciona, `'inativa'` → remove) — o roteiro original só descrevia `onDocumentUpdated` para a
direção de cancelamento; a direção de **reativação** (matricular de novo numa turma onde a
matrícula já existia, cancelada) foi incluída porque `matricularAluno` reaproveita o documento
existente via `setDoc`/`updateDoc` em vez de criar um novo, o que dispara `onDocumentUpdated`
em vez de `onDocumentCreated` — sem tratar essa direção, reativar uma matrícula deixaria o
aluno sem acesso às sessões futuras da turma, o mesmo bug que esta rodada existe para resolver.

**Teste de integração** (`tests/functions/sincronizacao-leitores.test.ts`, `npm run
test:functions`): sobe os emuladores de Functions e Firestore juntos, grava/atualiza
documentos de matrícula "com as regras desligadas" (irrelevante para o gatilho — o Firestore
emite o evento de mudança independentemente de como a escrita foi autorizada) e sonda
(`aguardar`, com tempo limite) o efeito assíncrono em `leitoresIds`. Cobre: matrícula nova
numa turma com sessão futura pré-existente (o caso que o client não resolvia), cancelamento,
reativação, e o caso negativo de uma matrícula que nunca fica `'ativa'`.

**Achado ao configurar o ambiente**: `firebase-admin@14.x` traz `jwks-rsa@4.x`, que depende de
`jose@6.x` (pacote ESM-only) — o emulador de Functions do `firebase-tools` carrega o código da
function via `require()` (CommonJS) e falha com `ERR_REQUIRE_ESM` ao tentar carregar esse
pacote transitivo. Fixado usando `firebase-admin@13.10.0`, cuja cadeia de dependências resolve
para `jose@4.x` (compatível com CommonJS). Vale registrar caso uma atualização futura de
`firebase-admin` reintroduza o problema.

**Alternativa descartada**: denormalizar um índice de IDs de sessões futuras no próprio
documento da turma (que é aberto para leitura, então o aluno conseguiria enumerar sem precisar
ler `sessoes` primeiro, e então escrever "às cegas" por ID direto): resolveria sem Cloud
Function, mas exige manter esse índice atualizado toda vez que uma sessão muda de status
(`abrirSessao`, `encerrarSessao`), um novo campo e uma nova superfície de manutenção. A Cloud
Function resolve com menos superfície nova (nenhum campo adicional, nenhuma regra nova) e sem
o risco de o índice da turma ficar dessincronizado da coleção `sessoes` de verdade.

## 2026-09-08 — "Encerramento" de vínculo professor-academia não implementado

`autonomo` do professor volta para `true` quando o vínculo aceito com uma academia é
encerrado — mas não existe hoje nenhum fluxo de "encerrar vínculo" no aplicativo: apenas
solicitar (`pendente`), aceitar (`aceito`) e recusar (`recusado`). Implementar esse fluxo é
literalmente RF09 ("a academia consulte, aceite e encerre vínculos com professores"), que é
Ciclo 3 e está fora do escopo desta rodada. `responderSolicitacao()` grava `autonomo: false`
no aceite; a reversão para `true` (e a remoção da entrada correspondente em `responsaveisIds`
do documento privado) fica documentada como trabalho do Ciclo 3, junto de RF09.
