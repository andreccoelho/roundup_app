# RoundUp — Cloud Function para sincronizar leitoresIds na matrícula

## Problema

`matriculas.create` não consegue adicionar o aluno a `leitoresIds` de sessões já existentes da turma: para isso precisaria consultar essas sessões, e a consulta só passa na regra se o aluno já estiver em `leitoresIds`, o que ainda não está. Paradoxo de ordem, sem solução no cliente. RF14 fica quebrado para quem se matricula em turma já em andamento.

## Solução

Cloud Function com Admin SDK, que ignora as regras de segurança e resolve o paradoxo.

**Aviso ao usuário antes de começar:** isso exige o plano Blaze (pay-as-you-go) no projeto Firebase. O gatilho em si tem cota gratuita generosa (2 milhões de invocações/mês), mas o plano Spark não permite Cloud Functions. Confirme que o projeto já está no Blaze antes de fazer deploy; se não estiver, pare e avise.

## Implementação

**1.** Inicialize `functions/` com `firebase init functions`, TypeScript, se ainda não existir.

**2.** `functions/src/index.ts`, gatilho `onDocumentCreated` em `matriculas/{matriculaId}`:

```ts
export const sincronizarLeitorNaMatricula = onDocumentCreated(
  'matriculas/{matriculaId}',
  async (event) => {
    const matricula = event.data?.data();
    if (!matricula || matricula.status !== 'ativa') return;

    const agora = Timestamp.now();
    const sessoesSnap = await db.collection('sessoes')
      .where('turmaId', '==', matricula.turmaId)
      .where('inicio', '>=', agora)
      .where('status', 'in', ['agendada', 'aberta'])
      .get();

    const batch = db.batch();
    sessoesSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        leitoresIds: FieldValue.arrayUnion(matricula.alunoId),
      });
    });
    await batch.commit();
  }
);
```

Sem `limit`: se a turma tiver centenas de sessões futuras, fatie em lotes de 500 (limite do `batch`). Log de erro claro se isso acontecer, não falhe silenciosamente.

**3.** Espelhe o mesmo gatilho para `onDocumentUpdated`, cobrindo `cancelarMatricula` (status vira `'inativa'`): usa `arrayRemove` em vez de `arrayUnion`, mesmo filtro de sessões futuras.

**4.** Em `src/services/matriculas.ts`, remova a chamada direta a `atualizarLeitoresDasSessoesFuturas` que hoje engole o erro — a sincronização passa a ser responsabilidade exclusiva da function. Deixe o service apenas criar/atualizar o documento de matrícula.

**5.** Teste no emulador: `firebase emulators:start --only functions,firestore`, crie uma matrícula em turma com sessão futura já cadastrada, confirme que `leitoresIds` foi atualizado. Adicione um teste de integração em `tests/functions/sincronizacao-leitores.test.ts` cobrindo matrícula e cancelamento.

**6.** Atualize `docs/decisoes-tecnicas.md`: substitua a entrada de limitação conhecida por uma entrada de decisão, explicando por que a sincronização saiu do cliente e foi para Cloud Function.

## Verificação

- `npx tsc --noEmit` em `functions/` e no app.
- Teste de integração da function passando no emulador.
- `npm run test:rules` continua 100% (nenhuma regra muda nesta rodada).
- Comando de deploy, sem executar: `firebase deploy --only functions,firestore:rules,firestore:indexes`.

## Não fazer

- Não alterar `firestore.rules`. O problema era de fluxo de escrita, não de regra.
- Não implementar retry ou fila; se o batch falhar, logar e seguir — cobertura de falha fica para o Ciclo 4.