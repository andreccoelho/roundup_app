// RF22, RF10: migração única — grava `professorId` nas matrículas e nos check-ins que já existiam antes
// de o professor atribuído pela academia poder vê-los e validar presença. Usa a mesma função da
// Cloud Function (functions/lib/professorNosRegistros.js, reconciliarProfessorDaTurma), turma a turma:
// quem tem professor atribuído (diferente do responsável) ganha o campo; o resto não é tocado.
// Idempotente: só altera o que está diferente.
//
// Uso (precisa de credenciais Admin: `gcloud auth application-default login` ou
// GOOGLE_APPLICATION_CREDENTIALS apontando para uma chave de conta de serviço):
//   npm --prefix functions run build
//   node scripts/migrar-professor-nos-registros.cjs            # só mostra o que faria (dry-run)
//   node scripts/migrar-professor-nos-registros.cjs --aplicar  # grava
const path = require('path');
const requireDeFunctions = require('module').createRequire(path.join(__dirname, '../functions/package.json'));
const { initializeApp } = requireDeFunctions('firebase-admin/app');
const { getFirestore } = requireDeFunctions('firebase-admin/firestore');

const aplicar = process.argv.includes('--aplicar');

async function main() {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'roundup-app-a5a82' });
  const { reconciliarProfessorDaTurma, professorDaTurma } = requireDeFunctions('./lib/professorNosRegistros.js');
  const db = getFirestore();
  const turmas = await db.collection('turmas').get();
  let total = 0;

  for (const turma of turmas.docs) {
    const professorId = professorDaTurma(turma.data());
    if (!professorId) continue;
    if (aplicar) {
      // eslint-disable-next-line no-await-in-loop
      const n = await reconciliarProfessorDaTurma(db, turma.id);
      total += n;
      if (n > 0) console.log(`turma ${turma.id} (${turma.data().nome}): ${n} registros atualizados`);
    } else {
      // eslint-disable-next-line no-await-in-loop
      const [m, c] = await Promise.all([
        db.collection('matriculas').where('turmaId', '==', turma.id).get(),
        db.collection('checkins').where('turmaId', '==', turma.id).get(),
      ]);
      const n = [...m.docs, ...c.docs].filter((d) => d.data().professorId !== professorId).length;
      total += n;
      if (n > 0) console.log(`turma ${turma.id} (${turma.data().nome}): atualizaria ${n} registros`);
    }
  }
  console.log(`${turmas.size} turmas lidas, ${total} registros ${aplicar ? 'atualizados' : 'a atualizar'}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
