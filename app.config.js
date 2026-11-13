// RF31: configuração dinâmica por cima do app.json. Liga o google-services.json (credencial do FCM,
// necessária para o Android receber push) só quando o arquivo existe — sem ele, o build continua
// funcionando, só sem push no Android. No EAS, o caminho pode vir da variável de ambiente do tipo
// arquivo GOOGLE_SERVICES_JSON (ver docs/ROTEIRO_TESTE_NOTIFICACOES.md).
const fs = require('fs');

module.exports = ({ config }) => {
  const arquivo = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
  if (!fs.existsSync(arquivo)) return config;
  return { ...config, android: { ...config.android, googleServicesFile: arquivo } };
};
