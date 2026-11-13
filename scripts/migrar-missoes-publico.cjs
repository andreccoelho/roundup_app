// RF23: migração única das missões criadas antes do público-alvo e da vigência. Grava nelas
// `publicoAlvo: 'todos'` e `vigenciaInicio = criadoEm` (sem fim — elas continuam valendo como
// antes). A escrita dispara a Cloud Function sincronizarMissaoNaEscrita, que calcula
// `leitoresIds` e `situacao`. Até isso acontecer, o aluno não vê a missão, porque o app passou a
// consultar por `leitoresIds`.
//
// Mesmo sem o script, o agendamento diário (virarSituacaoDasMissoes, 00:05) recalcula as missões
// ativas sem `situacao` — o script só antecipa e deixa os campos explícitos.
// Idempotente: pode rodar de novo sem efeito colateral.
//
// Uso (precisa de credenciais Admin: `gcloud auth application-default login` ou
// GOOGLE_APPLICATION_CREDENTIALS apontando para uma chave de conta de serviço):
//   node scripts/migrar-missoes-publico.cjs            # só mostra o que faria (dry-run)
//   node scripts/migrar-missoes-publico.cjs --aplicar  # grava
const path = require('path');
const requireDeFunctions = require('module').createRequire(path.join(__dirname, '../functions/package.json'));
const { initializeApp } = requireDeFunctions('firebase-admin/app');
const { getFirestore } = requireDeFunctions('firebase-admin/firestore');

const aplicar = process.argv.includes('--aplicar');

async function main() {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'roundup-app-a5a82' });
  const db = getFirestore();
  const missoes = await db.collection('missoes').get();
  let migradas = 0;

  for (const m of missoes.docs) {
    const dados = m.data();
    if (dados.publicoAlvo && dados.vigenciaInicio) continue;
    migradas += 1;
    console.log(`${aplicar ? 'migrando' : 'migraria'} ${m.id} (${dados.titulo ?? 'sem título'})`);
    if (!aplicar) continue;
    const campos = {};
    if (!dados.publicoAlvo) campos.publicoAlvo = 'todos';
    if (!dados.vigenciaInicio && dados.criadoEm) campos.vigenciaInicio = dados.criadoEm;
    await m.ref.update(campos);
  }

  console.log(`${missoes.size} missões lidas, ${migradas} ${aplicar ? 'migradas' : 'a migrar'}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
