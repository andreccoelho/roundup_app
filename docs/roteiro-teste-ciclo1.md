# Roteiro de teste manual — Ciclo 1

Cobre RF01–RF08, RF10–RF15, RN02, RN05–RN08 com dois usuários de perfis diferentes:
**Usuário A** (academia ou professor — "gestor") e **Usuário B** (aluno).

Pré-requisito: dois cadastros já feitos (RF01), um com perfil `academia` ou `professor` e outro com perfil `aluno`, logados em dois dispositivos/simuladores (ou duas sessões).

## Cobertura automatizada (`npm run test:rules`, `tests/rules/`)

A parte de **regras de segurança** de cada passo abaixo agora tem teste automatizado no
emulador — o teste cobre "a regra aceita/nega a escrita ou leitura certa", não "a tela
reage certo". A coluna "Automatizado" aponta o arquivo; "Manual" é o que só a interface real
comprova (navegação, estados de carregando/vazio/erro, contagem de toques da RNF01).

| Passo | Automatizado (regra) | Continua manual (interface) |
|---|---|---|
| 1. Gestor cria turma | `turmas.test.ts` (cria, nega responsavelId de outro, nega aluno) | Formulário, lista atualiza na hora |
| 2. Vínculo, aceite | `vinculos.test.ts`, `usuarios.test.ts` (RN06, documento privado de vínculos) | Botões "Solicitado"/"Aceitar", solicitação some da lista |
| 3. Turma disponível, matrícula | `matriculas.test.ts` (RN05, ID determinístico, documento privado fechado a terceiros) | Indicação visual "Matriculado", roster no detalhe da turma |
| 4. Sessão com janela aberta | `sessoes.test.ts` (RN07, janela invertida negada, `leitoresIds` inclui o aluno já matriculado) | Formulário de data/hora, cálculo exibido na tela |
| 5. Check-in com sucesso | `checkins.test.ts` (dentro da janela); `sessoes.test.ts` (aluno em `leitoresIds` lê, aluno de outra turma não lê) | Botão muda para "Check-in feito" em 2 toques (RNF01) |
| 6. Segundo check-in (RN02) | `checkins.test.ts` ("segundo check-in é negado") | Mensagem de erro do service aparece na tela |
| 7. Check-in fora da janela (RN08) | `checkins.test.ts` (antes/depois da janela) | Botão desabilitado com o motivo certo |
| 8. Aluno não matriculado | `checkins.test.ts` ("aluno não matriculado é negado") | — (cenário não alcançável pela UI normal) |
| 9. Histórico e tela da sessão | `checkins.test.ts` (leitura por `alunoId`/`responsavelId`) | Ordenação decrescente na tela, status "pendente" visível |
| Limite de acessos em escala | `limite-acessos.test.ts` (10 turmas/sessões via `leitoresIds`, sem `get()` na leitura) | — |
| Sincronia de `leitoresIds` na (des)matrícula | `tests/functions/sincronizacao-leitores.test.ts` (`npm run test:functions`, emulador de Functions + Firestore) | — |

O passo 3 depende de RF08 (descoberta de turmas), que hoje é aberta a qualquer autenticado
para turmas ativas — não mais condicionada a vínculo na regra (ver `docs/decisoes-tecnicas.md`).

A ordem dos passos 3 e 4 **não importa mais**: a sincronização de `leitoresIds` na matrícula é
feita por uma Cloud Function (`functions/src/index.ts`, Admin SDK), que adiciona o aluno a
`leitoresIds` de sessões futuras mesmo que já existissem antes da matrícula. Isso corrige um
gap que existia numa rodada anterior (quando a sincronização era só do client) — ver
`docs/decisoes-tecnicas.md`. Se o app estiver rodando contra um projeto Firebase real, a
function precisa estar publicada (`firebase deploy --only functions`) para esse efeito
acontecer; testando só com os emuladores, suba Functions junto com Firestore.

## 1. Gestor cria turma (RF10)
1. Usuário A faz login e abre **Dashboard → Turmas**.
2. Preenche nome, modalidade e nível, toca em "Criar turma".
3. **Esperado**: a turma aparece na lista "Minhas turmas" imediatamente.

## 2. Aluno solicita vínculo, gestor aceita (RF07/RF08, RN05, RN06)
1. Usuário B abre **Dashboard → Vincular-se**, encontra o Usuário A na lista de academias/professores e toca em "Solicitar vínculo".
2. **Esperado**: botão muda para "Solicitado".
3. Usuário A abre **Dashboard → Solicitações pendentes**, vê a solicitação de B e toca em "Aceitar".
4. **Esperado**: a solicitação some da lista de pendentes.

## 3. Aluno vê a turma disponível e se matricula (RF11)
1. Usuário B abre **Dashboard → Turmas disponíveis**.
2. **Esperado**: a turma criada no passo 1 aparece na lista (só aparece porque o vínculo do passo 2 está `aceito` — RN05).
3. Toca em "Matricular".
4. **Esperado**: botão muda para "Matriculado".
5. Usuário A abre **Turmas → (a turma) → detalhe**.
6. **Esperado**: o nome de B aparece em "Alunos matriculados".

## 4. Gestor cria sessão com janela de check-in já aberta (RF12, RN07, RN08)
1. Usuário A, na tela de detalhe da turma, preenche uma sessão com **data de hoje**, horário de início **alguns minutos no passado** (ex.: 5 min atrás) e horário de fim **alguns minutos no futuro** (ex.: 1h à frente), e toca em "Criar sessão".
2. **Esperado**: a sessão aparece na lista "Sessões". A janela de check-in é `início - 30min` até o horário de fim, então com início 5 min atrás a janela já está aberta.

## 5. Aluno faz check-in com sucesso (RF13)
1. Usuário B abre **Dashboard → Agenda**.
2. **Esperado**: a sessão do passo 4 aparece com o botão "Fazer check-in" habilitado (dentro da janela).
3. Toca em "Fazer check-in".
4. **Esperado**: o botão muda para "Check-in feito" sem navegar para nenhuma tela intermediária (RNF01: no máximo 3 toques a partir do Dashboard — aqui foram 2: abrir Agenda + tocar no botão).

## 6. Aluno tenta segundo check-in na mesma sessão → erro de RN02
1. Ainda na Agenda, force uma segunda tentativa chamando `realizarCheckIn` novamente para a mesma sessão (ex.: puxe a lista para atualizar e tente tocar de novo antes do estado local bloquear, ou repita via um segundo dispositivo com a mesma conta).
2. **Esperado**: a chamada rejeita com a mensagem "Você já fez check-in nesta sessão." (RN02, garantido pelo ID determinístico `${sessaoId}_${alunoId}` que já existe).

## 7. Gestor cria sessão para daqui a dois dias, aluno tenta check-in → erro de RN08
1. Usuário A cria uma nova sessão na mesma turma com início e fim dois dias no futuro.
2. Usuário B abre a Agenda.
3. **Esperado**: a sessão aparece com o botão desabilitado mostrando "Check-in ainda não abriu".
4. Se a tentativa for forçada mesmo assim (via chamada direta ao service), **esperado**: erro "O check-in ainda não abriu para esta sessão." (RN08).

## 8. Aluno não matriculado tenta check-in → bloqueado pela regra
1. Com um terceiro usuário aluno (C) sem matrícula na turma, tente chamar `realizarCheckIn` para uma sessão da turma do passo 4.
2. **Esperado**: erro "Você não está matriculado nesta turma." — e mesmo que o client não bloqueasse, o `firestore.rules` nega a escrita (`matriculadoEm(turmaId)` falha), então a tentativa nunca é gravada.

## 9. Check-in aparece no histórico do aluno e na tela da sessão do gestor (RF15, RF13)
1. Usuário B abre **Dashboard → Histórico**.
2. **Esperado**: o check-in do passo 5 aparece no topo da lista (ordenado por data decrescente), com status "pendente" (validação é RF22, Ciclo 3).
3. Usuário A abre **Turmas → (a turma) → (a sessão do passo 4)**.
4. **Esperado**: o nome de B aparece em "Check-ins recebidos" com status "pendente".

---

Em cada etapa, se algo falhar, a tela correspondente deve mostrar o erro vindo do service (não uma mensagem genérica) — é assim que RN02 e RN08 ficam observáveis durante o teste manual.
