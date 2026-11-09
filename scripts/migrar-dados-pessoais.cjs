// RNF04: migração única — move email, dataNascimento e responsavelLegal do documento raiz
// usuarios/{uid} (legível por qualquer autenticado) para usuarios/{uid}/privado/dados (só o dono).
// Idempotente: pode rodar de novo sem efeito colateral.
//
// Uso (precisa de credenciais Admin: `gcloud auth application-default login` ou
// GOOGLE_APPLICATION_CREDENTIALS apontando para uma chave de conta de serviço):
//   node scripts/migrar-dados-pessoais.cjs            # só mostra o que faria (dry-run)
//   node scripts/migrar-dados-pessoais.cjs --aplicar  # grava
// firebase-admin só está instalado em functions/ (README: npm install separado)
const path = require('path');
const requireDeFunctions = require('module').createRequire(path.join(__dirname, '../functions/package.json'));
const { initializeApp } = requireDeFunctions('firebase-admin/app');
const { getFirestore, FieldValue } = requireDeFunctions('firebase-admin/firestore');

const CAMPOS = ['email', 'dataNascimento', 'responsavelLegal'];
const aplicar = process.argv.includes('--aplicar');

async function main() {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'roundup-app-a5a82' });
  const db = getFirestore();
  const usuarios = await db.collection('usuarios').get();
  let migrados = 0;

  for (const u of usuarios.docs) {
    const dados = u.data();
    const presentes = CAMPOS.filter((c) => dados[c] !== undefined);
    if (presentes.length === 0) continue;

    migrados += 1;
    console.log(`${aplicar ? 'migrando' : 'migraria'} ${u.id}: ${presentes.join(', ')}`);
    if (!aplicar) continue;

    const privado = {};
    presentes.forEach((c) => { privado[c] = dados[c]; });
    const lote = db.batch();
    lote.set(db.doc(`usuarios/${u.id}/privado/dados`), privado, { merge: true });
    lote.update(u.ref, Object.fromEntries(presentes.map((c) => [c, FieldValue.delete()])));
    await lote.commit();
  }

  console.log(`${usuarios.size} usuários lidos, ${migrados} ${aplicar ? 'migrados' : 'a migrar'}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
