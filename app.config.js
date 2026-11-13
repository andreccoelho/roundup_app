// Configuração dinâmica por cima do app.json.
// RF31: liga o google-services.json (credencial do FCM, necessária para o Android receber push) só
// quando o arquivo existe — sem ele, o build continua funcionando, só sem push no Android. No EAS, o
// caminho pode vir da variável de ambiente do tipo arquivo GOOGLE_SERVICES_JSON.
// RF31 (teste no iPhone pelo Expo Go): com o projeto ligado ao EAS (`eas init` grava
// extra.eas.projectId), aponta os updates para ele — é o que `eas update` publica e o Expo Go abre.
// Ver docs/ROTEIRO_TESTE_NOTIFICACOES.md.
const fs = require('fs');

module.exports = ({ config }) => {
  const arquivo = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
  const projectId = config.extra?.eas?.projectId;
  return {
    ...config,
    ...(projectId ? { updates: { ...config.updates, url: `https://u.expo.dev/${projectId}` } } : {}),
    ...(fs.existsSync(arquivo) ? { android: { ...config.android, googleServicesFile: arquivo } } : {}),
  };
};
