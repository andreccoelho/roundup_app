// RF33: migração única — converte a graduação em texto livre dos alunos existentes
// (`usuarios.graduacoes[modalidade]`, ex.: "Faixa roxa, 2º grau") na graduação estruturada
// `usuarios.faixasEstruturadas[modalidade] = { faixaId, faixa, cor, grau, responsavelId }`.
//
// Estrutura usada para casar o texto, por modalidade: a do responsável da graduação mais recente
// do aluno naquela modalidade; sem graduação registrada, a do primeiro responsável com vínculo
// aceito; sem personalização, a estrutura padrão. O texto que não casa com nenhuma faixa (ex.:
// "Kruang 5") fica como está: continua aparecendo, sem barra de progresso — listado no fim.
// O texto (`graduacoes`, `faixaOuGrau`) não é alterado. Idempotente: só preenche o que falta.
//
// O app também casa o texto na hora de mostrar (src/utils/faixas.ts, resolverGraduacao), então a
// migração não é obrigatória para a barra aparecer; ela fixa a faixa pelo id, o que sobrevive a
// uma renomeação posterior da faixa pelo responsável.
//
// Uso (precisa de credenciais Admin: `gcloud auth application-default login` ou
// GOOGLE_APPLICATION_CREDENTIALS apontando para uma chave de conta de serviço):
//   npm --prefix functions run build                # compila functions/lib
//   node scripts/migrar-faixas.cjs                  # só mostra o que faria (dry-run)
//   node scripts/migrar-faixas.cjs --aplicar        # grava
const path = require('path');
const requireDeFunctions = require('module').createRequire(path.join(__dirname, '../functions/package.json'));
const { initializeApp } = requireDeFunctions('firebase-admin/app');
const { getFirestore } = requireDeFunctions('firebase-admin/firestore');
const { estruturaDaModalidade, casarTexto } = requireDeFunctions('./lib/faixasRegras.js');

const aplicar = process.argv.includes('--aplicar');
const SEM_FAIXA = ['sem graduação', 'não se aplica', ''];

async function main() {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'roundup-app-a5a82' });
  const db = getFirestore();
  const alunos = await db.collection('usuarios').where('perfil', '==', 'aluno').get();
  const estruturas = new Map();
  async function estruturaDe(responsavelId) {
    if (!responsavelId) return undefined;
    if (!estruturas.has(responsavelId)) {
      estruturas.set(responsavelId, (await db.doc(`estruturasFaixas/${responsavelId}`).get()).data()?.modalidades);
    }
    return estruturas.get(responsavelId);
  }

  let convertidas = 0;
  const semCasamento = [];
  for (const aluno of alunos.docs) {
    const dados = aluno.data();
    const textos = dados.graduacoes ?? {};
    const jaTem = dados.faixasEstruturadas ?? {};
    const pendentes = Object.entries(textos).filter(([m, t]) => !jaTem[m] && !SEM_FAIXA.includes(String(t).trim().toLowerCase()));
    if (pendentes.length === 0) continue;

    /* eslint-disable no-await-in-loop */
    const [graduacoes, vinculos] = await Promise.all([
      db.collection('graduacoes').where('alunoId', '==', aluno.id).get(),
      db.doc(`usuarios/${aluno.id}/privado/vinculos`).get(),
    ]);
    const novas = {};
    for (const [modalidade, texto] of pendentes) {
      const ultima = graduacoes.docs
        .map((g) => g.data())
        .filter((g) => g.modalidade === modalidade)
        .sort((a, b) => (b.dataGraduacao?.toMillis?.() ?? 0) - (a.dataGraduacao?.toMillis?.() ?? 0))[0];
      const responsavelId = ultima?.responsavelId ?? vinculos.data()?.responsaveisIds?.[0];
      const faixas = estruturaDaModalidade(await estruturaDe(responsavelId), modalidade);
      const casado = casarTexto(faixas, String(texto));
      if (!casado) {
        semCasamento.push(`${aluno.id} / ${modalidade}: "${texto}"`);
        continue;
      }
      novas[modalidade] = {
        faixaId: casado.faixa.id, faixa: casado.faixa.nome, cor: casado.faixa.cor, grau: casado.grau,
        ...(responsavelId ? { responsavelId } : {}),
      };
    }
    /* eslint-enable no-await-in-loop */
    const lista = Object.entries(novas).map(([m, f]) => `${m} → ${f.faixa}${f.grau ? ` ${f.grau}º grau` : ''}`);
    if (lista.length === 0) continue;
    convertidas += lista.length;
    console.log(`${aplicar ? 'convertendo' : 'converteria'} ${aluno.id}: ${lista.join('; ')}`);
    // eslint-disable-next-line no-await-in-loop
    if (aplicar) await aluno.ref.set({ faixasEstruturadas: novas }, { merge: true });
  }

  console.log(`${alunos.size} alunos lidos, ${convertidas} graduações ${aplicar ? 'convertidas' : 'a converter'}.`);
  if (semCasamento.length > 0) {
    console.log(`\nSem faixa correspondente (continuam só em texto, sem barra de progresso):\n  ${semCasamento.join('\n  ')}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
