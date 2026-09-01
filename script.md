# Prompt para Claude Code — Corrigir regra de leitura de `usuarios`

Copie e cole o texto abaixo no Claude Code, dentro do repositório do projeto (`roundup_app`).

---

No `firestore.rules`, a regra da coleção `usuarios` está bloqueando as queries de descoberta usadas em `listarAcademiasDisponiveis` e `listarProfessoresAutonomos` (telas `VincularAlunoScreen`/`VincularProfessorScreen`). A regra atual só libera `get` do próprio documento, e como essas funções fazem `where('perfil', '==', ...)`, o Firestore trata isso como `list` e nega a query inteira (nenhum documento de outro UID passa na condição), retornando lista vazia sem erro visível na tela.

Troque a regra de `usuarios` de:

```
match /usuarios/{usuarioId} {
  allow read, write: if request.auth != null && request.auth.uid == usuarioId;
}
```

para:

```
match /usuarios/{usuarioId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == usuarioId;
}
```

Isso libera leitura (get e list/query) para qualquer usuário autenticado, mantendo a escrita restrita ao dono do documento. Mantenha todo o resto do arquivo (`vinculos`, `turmas`, `sessoes`, `checkins`, e o bloco final que nega tudo mais) exatamente como está.

Depois de editar, rode `firebase deploy --only firestore:rules` (ou o comando equivalente já usado no projeto) para publicar, e confirme que `VincularAlunoScreen` passa a listar academias e professores autônomos existentes no Firestore.

**Atenção de segurança para deixar registrada no commit**: essa mudança expõe o documento inteiro de `usuarios/{uid}` (nome, telefone, email, o que mais estiver salvo lá) para qualquer usuário autenticado, não só os campos usados na descoberta (`perfil`, `nome`). É uma solução rápida para destravar o fluxo agora; considerar depois separar uma coleção pública mínima (ex.: `diretorioPublico`) só com os campos necessários para descoberta, mantendo `usuarios` privado, para atender RNF04 (isolamento de dados) de forma mais correta.