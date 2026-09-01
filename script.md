# Prompt para Claude Code — Levantamento de types + botão de teste de vínculo

Cole o bloco abaixo como instrução no Claude Code, dentro do repositório `roundup_app`.

---

## Contexto

O projeto RoundUp já tem Firebase configurado e funcionando (Auth + Firestore), com regras de segurança publicadas para as coleções `usuarios` e `vinculos`. As telas ainda não têm conteúdo funcional além de placeholders, então não existe forma de testar `criarVinculo` pelo fluxo real do app ainda.

## Tarefa, parte A: levantamento de informação

Abrir `src/types/` (pode ser `index.ts` ou arquivos separados) e reportar de volta, na resposta, o conteúdo completo e exato de:
- `StatusVinculo` (o enum ou union type, com todos os valores literais)
- `Turma`
- `Sessao`
- `CheckIn`

Não resumir nem parafrasear, colar o código-fonte real dessas definições na resposta.

## Tarefa, parte B: botão de teste temporário

Em uma das telas de dashboard placeholder já existentes (`src/screens/aluno/DashboardScreen.tsx` ou equivalente, a que já é alcançada depois do login funcionar), adicionar um botão temporário que:

1. Chama `criarVinculo` de `src/services/vinculos.ts`
2. Usa `usuario.id` (do `useAuth()`) como `solicitanteId`
3. Usa uma constante no topo do arquivo, `UID_DESTINATARIO_TESTE`, como `destinatarioId`, com um comentário deixando claro que o desenvolvedor precisa substituir esse valor por um UID real de outro usuário de teste (pego em Authentication → Users no console)
4. Usa o valor real e correto de `StatusVinculo` para o estado inicial de um vínculo recém-criado (o valor correto está na parte A do levantamento, não usar um nome chutado)
5. Envolve a chamada em try/catch, e mostra o resultado (sucesso ou o erro do Firebase, incluindo `permission-denied` se acontecer) via `Alert.alert` ou `console.log`, o que for mais simples de ver no ambiente de teste

Marcar claramente esse bloco de código com um comentário do tipo `// TODO: remover após validar a regra de segurança de vinculos`, para não ser confundido com funcionalidade definitiva depois.

## O que não fazer

- Não remover nem alterar nenhuma tela ou navegação existente além de adicionar o botão.
- Não mexer nas regras do Firestore, isso é feito manualmente no console pelo desenvolvedor.
- Não implementar a tela de vínculo definitiva agora, esse botão é só para validar a regra de segurança que já foi publicada.

## Entrega esperada

- O conteúdo literal de `StatusVinculo`, `Turma`, `Sessao` e `CheckIn`, colado na resposta.
- Confirmação de que `npx tsc --noEmit` roda sem erro depois da mudança.
- Nome do arquivo onde o botão de teste foi adicionado.