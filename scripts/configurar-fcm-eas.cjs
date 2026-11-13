// RF31: liga a chave de conta de serviço do Firebase (FCM V1) às credenciais Android do projeto no
// EAS — o mesmo que `eas credentials` → Android → "Google Service Account Key for Push
// Notifications (FCM V1)" faz de forma interativa, mas sem perguntas, para rodar no GitHub Actions
// (.github/workflows/preparar-teste-notificacoes.yml).
//
// Usa a API GraphQL da Expo com as mesmas operações do eas-cli (createGoogleServiceAccountKey,
// createAndroidAppCredentials, setGoogleServiceAccountKeyForFcmV1). Idempotente: se o projeto já
// tem uma chave FCM V1 com o mesmo client_email, não faz nada.
//
// Uso: EXPO_TOKEN=... node scripts/configurar-fcm-eas.cjs caminho/da/chave.json
//   (lê o projectId de app.json → expo.extra.eas.projectId, gravado por `eas init`)
const fs = require('fs');
const path = require('path');

const API = 'https://api.expo.dev/graphql';
const PACOTE = 'br.com.roundup.app';

async function graphql(query, variables) {
  const resposta = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization: `Bearer ${process.env.EXPO_TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const corpo = await resposta.json();
  if (!resposta.ok || corpo.errors) throw new Error(`API da Expo: ${JSON.stringify(corpo.errors ?? corpo)}`);
  return corpo.data;
}

async function main() {
  const arquivoChave = process.argv[2];
  if (!process.env.EXPO_TOKEN) throw new Error('Falta EXPO_TOKEN.');
  if (!arquivoChave || !fs.existsSync(arquivoChave)) throw new Error('Passe o caminho do JSON da conta de serviço.');
  const chave = JSON.parse(fs.readFileSync(arquivoChave, 'utf8'));
  const app = JSON.parse(fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8'));
  const projectId = app.expo?.extra?.eas?.projectId;
  if (!projectId) throw new Error('app.json sem expo.extra.eas.projectId — rode `eas init` antes.');

  const { app: { byId: projeto } } = await graphql(`
    query ($appId: String!, $pacote: String) {
      app {
        byId(appId: $appId) {
          id
          fullName
          ownerAccount { id }
          androidAppCredentials(filter: { applicationIdentifier: $pacote }) {
            id
            googleServiceAccountKeyForFcmV1 { id clientEmail }
          }
        }
      }
    }`, { appId: projectId, pacote: PACOTE });

  let credenciais = projeto.androidAppCredentials[0];
  if (credenciais?.googleServiceAccountKeyForFcmV1?.clientEmail === chave.client_email) {
    console.log(`${projeto.fullName}: chave FCM V1 de ${chave.client_email} já configurada.`);
    return;
  }
  if (!credenciais) {
    const criadas = await graphql(`
      mutation ($input: AndroidAppCredentialsInput!, $appId: ID!, $pacote: String!) {
        androidAppCredentials {
          createAndroidAppCredentials(androidAppCredentialsInput: $input, appId: $appId, applicationIdentifier: $pacote) { id }
        }
      }`, { input: {}, appId: projeto.id, pacote: PACOTE });
    credenciais = criadas.androidAppCredentials.createAndroidAppCredentials;
  }
  const { googleServiceAccountKey: { createGoogleServiceAccountKey: novaChave } } = await graphql(`
    mutation ($input: GoogleServiceAccountKeyInput!, $accountId: ID!) {
      googleServiceAccountKey {
        createGoogleServiceAccountKey(googleServiceAccountKeyInput: $input, accountId: $accountId) { id }
      }
    }`, { input: { jsonKey: chave }, accountId: projeto.ownerAccount.id });
  await graphql(`
    mutation ($credenciais: ID!, $chave: ID!) {
      androidAppCredentials {
        setGoogleServiceAccountKeyForFcmV1(id: $credenciais, googleServiceAccountKeyId: $chave) { id }
      }
    }`, { credenciais: credenciais.id, chave: novaChave.id });
  console.log(`${projeto.fullName}: chave FCM V1 de ${chave.client_email} configurada para ${PACOTE}.`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
