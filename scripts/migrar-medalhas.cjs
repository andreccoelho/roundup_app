// RF19: migração única — registra em usuarios/{uid}/medalhas as medalhas que os alunos já
// existentes atingiram antes de a coleção existir, com a data reconstruída do histórico:
//   - treinos-N: quando o N-ésimo check-in foi validado (validadoEm; sem ele, o horário do treino);
//   - sequência-N: quando foi validada a sessão que completou N treinos seguidos;
//   - primeira graduação: a data da primeira graduação registrada.
// Usa a mesma função da Cloud Function (functions/lib/medalhas.js, avaliarMedalhas), com
// origem 'migracao' e sem notificar ninguém. Só cria o que falta: idempotente, pode rodar de novo.
//
// Uso (precisa de credenciais Admin: `gcloud auth application-default login` ou
// GOOGLE_APPLICATION_CREDENTIALS apontando para uma chave de conta de serviço):
//   npm --prefix functions run build                 # compila functions/lib
//   node scripts/migrar-medalhas.cjs                 # só mostra o que faria (dry-run)
//   node scripts/migrar-medalhas.cjs --aplicar       # grava
const path = require('path');
const requireDeFunctions = require('module').createRequire(path.join(__dirname, '../functions/package.json'));
const { initializeApp } = requireDeFunctions('firebase-admin/app');
const { getFirestore } = requireDeFunctions('firebase-admin/firestore');

const aplicar = process.argv.includes('--aplicar');

async function main() {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'roundup-app-a5a82' });
  // Depois do initializeApp: o módulo usa o app padrão
  const { avaliarMedalhas } = requireDeFunctions('./lib/medalhas.js');
  const db = getFirestore();
  const alunos = await db.collection('usuarios').where('perfil', '==', 'aluno').get();
  let total = 0;

  for (const aluno of alunos.docs) {
    // eslint-disable-next-line no-await-in-loop
    const novas = await avaliarMedalhas(db, aluno.id, { origem: 'migracao', aplicar, notificar: false });
    if (novas.length === 0) continue;
    total += novas.length;
    const lista = novas.map((m) => `${m.id} (${m.conquistadaEm.toISOString().slice(0, 10)})`).join(', ');
    console.log(`${aplicar ? 'registrando' : 'registraria'} ${aluno.id}: ${lista}`);
  }

  console.log(`${alunos.size} alunos lidos, ${total} medalhas ${aplicar ? 'registradas' : 'a registrar'}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
