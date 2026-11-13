# Roteiro — validar as notificações (RF31) no celular

Objetivo: ver chegar no aparelho os 3 tipos de push (lembrete de sessão, nova missão, conquista). No emulador o envio já foi testado (status `simulado`); falta o caminho real: Cloud Function → serviço de push da Expo → FCM/APNs → celular.

Tempo estimado: ~1h na primeira vez (a maior parte é esperar o build). Comece pelo **Android**: não exige conta paga da Apple.

---

## O que só você pode fazer

| Item | Por quê | Custo |
|---|---|---|
| Plano **Blaze** no projeto Firebase `roundup-app-a5a82` | Deploy de Cloud Functions e Cloud Scheduler (lembrete diário) | Pago por uso; o volume do TCC fica na cota gratuita |
| Conta Expo + `npx eas init` | Gera o `projectId`, sem o qual o app não obtém token de push | Grátis |
| `google-services.json` + chave **FCM V1** no EAS | Credenciais do Android | Grátis |
| Chave **APNs** (só iOS) | Credencial do iPhone; exige Apple Developer Program | US$ 99/ano |
| Build de desenvolvimento (`eas build`) | Push remoto **não funciona no Expo Go** (Android, desde o SDK 53) | Grátis (fila do plano free) |
| Credencial Admin local (`gcloud auth application-default login`) | Rodar os scripts de migração | Grátis |

Já está pronto no repositório: `eas.json` (perfis `development`, `preview` e `production`), `expo-dev-client`, `android.package`/`ios.bundleIdentifier` = `br.com.roundup.app`, plugin `expo-notifications` com o canal `padrao` (o mesmo que as functions usam) e o `app.config.js`, que liga o `google-services.json` quando o arquivo existe.

---

## 1. Backend (uma vez)

1. No [Console do Firebase](https://console.firebase.google.com/), em **Uso e faturamento**, mude para o plano **Blaze**.
2. Na raiz do projeto:
   ```bash
   npx firebase login
   ```
   ```bash
   npx firebase deploy --only functions,firestore:rules,firestore:indexes --project roundup-app-a5a82
   ```
3. Rode as migrações desta rodada (cada uma faz dry-run sem `--aplicar`; confira a saída antes):
   ```bash
   gcloud auth application-default login
   ```
   ```bash
   npm --prefix functions run build
   ```
   ```bash
   node scripts/migrar-missoes-publico.cjs --aplicar
   ```
   ```bash
   node scripts/migrar-medalhas.cjs --aplicar
   ```
   ```bash
   node scripts/migrar-faixas.cjs --aplicar
   ```

## 2. Projeto Expo (uma vez)

```bash
npm install -g eas-cli
```
```bash
eas login
```
```bash
eas init
```
O `eas init` grava `extra.eas.projectId` (e `owner`) no `app.json`. Faça commit dessa mudança.

## 3. Credenciais do Android (uma vez)

1. Console do Firebase → **Configurações do projeto → Seus apps → Adicionar app → Android**, com o pacote **`br.com.roundup.app`**. Baixe o `google-services.json` e coloque na raiz do projeto. Faça commit dele, porque o EAS só envia arquivos versionados. Se preferir não versionar, crie no expo.dev uma variável de ambiente do tipo **arquivo** chamada `GOOGLE_SERVICES_JSON`.
2. Console do Firebase → **Configurações do projeto → Contas de serviço → Gerar nova chave privada**. Isso baixa um JSON; não versione esse arquivo.
3. Envie a chave para o EAS:
   ```bash
   eas credentials
   ```
   Escolha **Android → development → Google Service Account → Manage your Google Service Account Key for Push Notifications (FCM V1) → Upload** e aponte para o JSON do passo 2.

**iOS (opcional):** no primeiro `eas build --platform ios`, responda **sim** quando o EAS oferecer gerar a chave de push (APNs). Você precisa estar logado na conta Apple Developer, e o iPhone tem que estar registrado (`eas device:create`).

## 4. Build e instalação

```bash
eas build --profile development --platform android
```
Ao terminar, abra o link/QR code do build no celular e instale o APK. Depois, no computador:
```bash
npx expo start --dev-client
```
Abra o app **RoundUp** instalado (não o Expo Go) e leia o QR code.

## 5. Conferir que o aparelho foi registrado

1. Entre no app com uma conta de **aluno** e aceite a permissão de notificações.
2. No Console do Firebase → Firestore, abra `usuarios/{uid do aluno}/privado/notificacoes`. O campo `tokens` precisa ter um `ExponentPushToken[...]`.
   - Sem token: veja o log do Metro. A causa costuma ser falta de `projectId` (passo 2), permissão negada ou app aberto no Expo Go.
3. (Opcional, isola o celular do backend) Cole o token em <https://expo.dev/notifications> e envie um teste. Se chegar, o aparelho e as credenciais estão certos.
4. No Perfil do aluno → **Notificações**, deixe os 3 tipos ligados.

---

## 6. Disparar cada tipo

Use duas contas: o aluno do celular e o responsável dele (academia ou professor autônomo, com vínculo aceito). O responsável pode estar na web (`npm run web`).

### A. Nova missão
1. Como responsável: **Missões → Nova missão**.
2. Escolha o **Público-alvo** "Todos os alunos" (ou "Alunos escolhidos" marcando o aluno) e a vigência **começando hoje**.
3. Toque em **Criar**. Em alguns segundos chega "**Nova missão** — {título} — vale N pts."
- Cada aluno recebe o aviso **uma vez por missão**. Para repetir o teste, crie outra missão.
- Uma missão com início no futuro só avisa no dia do início, depois das 00:05. Aluno fora do público não recebe nada, e isso também vale testar.

### B. Conquista
Caminho mais rápido: como responsável, **Alunos → {aluno} → Registrar graduação → Confirmar**. Chega "**Nova graduação** — Parabéns: Faixa … em …".

Outros caminhos que também avisam (uma vez por conquista):
- **Missão concluída:** marque a conclusão de uma missão personalizada vigente em **Missões → Marcar conclusões**.
- **Medalha:** valide o check-in que completa 10 treinos (ou 7 seguidos). Chega "**Medalha conquistada**".

### C. Lembrete de sessão
O lembrete é automático, todo dia às 7h (Brasília), para alunos com sessão **agendada ou aberta hoje**.
1. Como responsável, crie uma sessão para **hoje** numa turma em que o aluno está matriculado.
2. Force a execução sem esperar as 7h: Google Cloud Console → **Cloud Scheduler** → job `firebase-schedule-enviarLembretesDeSessao-us-central1` → **Forçar execução**. Pelo terminal:
   ```bash
   gcloud scheduler jobs run firebase-schedule-enviarLembretesDeSessao-us-central1 --location us-central1 --project roundup-app-a5a82
   ```
3. Chega "**Treino hoje** — Você tem treino hoje às HH:MM…".
- O limite é de um lembrete por aluno por dia. Para repetir no mesmo dia, apague o campo `ultimoLembrete` em `usuarios/{uid}/privado/notificacoes`.

---

## 7. Onde olhar se não chegar

- **Firestore → coleção `notificacoes`:** um registro por envio, com `tipo` e `status`:
  - `enviado`: a Expo aceitou. Se não apareceu no celular, o problema está nas credenciais FCM/APNs ou no aparelho (modo não perturbe, economia de bateria);
  - `semDispositivo`: o aluno não tem token (volte ao passo 5);
  - `erro`: veja o log com o comando abaixo;
  - nenhum registro: a function não rodou, ou o aluno desligou esse tipo em Notificações.
- Logs das functions:
  ```bash
  npx firebase functions:log --project roundup-app-a5a82
  ```
- Se o projeto Expo estiver com "enhanced security for push" ligado, configure `EXPO_ACCESS_TOKEN` nas functions. Por padrão ele vem desligado.

## 8. Registrar o resultado

Para o relatório, anote para cada tipo (A, B, C): data, aparelho e versão do Android/iOS, se chegou com o app **aberto**, **em segundo plano** e **fechado**, e o print. Com isso, o RF31 passa de "implementado, testado no emulador" para "validado em aparelho".
