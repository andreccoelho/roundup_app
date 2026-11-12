// Contas e dados de DEMONSTRAÇÃO: uma academia, um professor e um aluno já vinculados, com turmas,
// sessões (passadas e futuras), check-ins validados, pontos, graduação e uma missão, para a demo
// parecer um app em uso. Idempotente: roda de novo sem duplicar (ids determinísticos; as datas
// são recalculadas em relação a "hoje", então rodar de novo na véspera da demo renova a agenda).
//
// Uso (precisa de credenciais Admin: `gcloud auth application-default login` ou
// GOOGLE_APPLICATION_CREDENTIALS apontando para uma chave de conta de serviço):
//   node scripts/seed-demo.cjs             # só mostra o que faria (dry-run)
//   node scripts/seed-demo.cjs --aplicar   # cria/atualiza no projeto roundup-app-a5a82
// Variáveis opcionais:
//   DEMO_SENHA=...       senha das 3 contas (padrão abaixo; mínimo 6 caracteres)
//   GCLOUD_PROJECT=...   outro projeto (ex.: demo-roundup-app com os emuladores rodando, que
//                        também exigem FIRESTORE_EMULATOR_HOST e FIREBASE_AUTH_EMULATOR_HOST)
// firebase-admin só está instalado em functions/ (README: npm install separado)
const path = require('path');
const requireDeFunctions = require('module').createRequire(path.join(__dirname, '../functions/package.json'));
const { initializeApp } = requireDeFunctions('firebase-admin/app');
const { getAuth } = requireDeFunctions('firebase-admin/auth');
const { getFirestore, Timestamp } = requireDeFunctions('firebase-admin/firestore');

const aplicar = process.argv.includes('--aplicar');
const SENHA = process.env.DEMO_SENHA || 'Demo@2026';
const PROJETO = process.env.GCLOUD_PROJECT || 'roundup-app-a5a82';

// example.com é domínio reservado (RFC 2606): nenhum e-mail real recebe nada
const CONTAS = {
  academia: { email: 'demo.academia@example.com', nome: 'Carla Mendes' },
  professor: { email: 'demo.professor@example.com', nome: 'Rafael Souza' },
  aluno: { email: 'demo.aluno@example.com', nome: 'Lucas Andrade' },
};

const MODALIDADE = 'Jiu-Jitsu';
const XP_POR_CHECKIN = 10; // == XP_POR_CHECKIN_VALIDADO em src/config/gamificacao.ts

const ts = (d) => Timestamp.fromDate(d);
const periodoDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const dia = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

function comHorario(base, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

async function garantirContaAuth(auth, { email, nome }) {
  try {
    const existente = await auth.getUserByEmail(email);
    await auth.updateUser(existente.uid, { displayName: nome, password: SENHA });
    return existente.uid;
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    const criado = await auth.createUser({ email, password: SENHA, displayName: nome, emailVerified: true });
    return criado.uid;
  }
}

async function main() {
  console.log(`Projeto: ${PROJETO} (${aplicar ? 'APLICAR' : 'dry-run, nada é gravado'})`);
  initializeApp({ projectId: PROJETO });
  const auth = getAuth();
  const db = getFirestore();
  const agora = new Date();
  const agoraTs = ts(agora);

  // ---------- contas ----------
  let uid;
  if (aplicar) {
    uid = {
      academia: await garantirContaAuth(auth, CONTAS.academia),
      professor: await garantirContaAuth(auth, CONTAS.professor),
      aluno: await garantirContaAuth(auth, CONTAS.aluno),
    };
  } else {
    uid = { academia: 'UID_ACADEMIA', professor: 'UID_PROFESSOR', aluno: 'UID_ALUNO' };
  }

  const docs = []; // [caminho, dados]
  const par = (caminho, dados) => docs.push([caminho, dados]);

  // ---------- usuarios (RF01 a RF06) ----------
  par(`usuarios/${uid.academia}`, {
    id: uid.academia, nome: CONTAS.academia.nome, perfil: 'academia',
    nomeAcademia: 'Academia Tatame Central', endereco: 'Rua das Palmeiras, 120 - Centro',
    modalidades: [MODALIDADE, 'Muay Thai'], criadoEm: agoraTs, atualizadoEm: agoraTs,
  });
  par(`usuarios/${uid.academia}/privado/dados`, { email: CONTAS.academia.email });

  par(`usuarios/${uid.professor}`, {
    id: uid.professor, nome: CONTAS.professor.nome, perfil: 'professor', autonomo: false,
    modalidades: [MODALIDADE], graduacao: 'Faixa preta, 2º grau', criadoEm: agoraTs, atualizadoEm: agoraTs,
  });
  par(`usuarios/${uid.professor}/privado/dados`, { email: CONTAS.professor.email });
  par(`usuarios/${uid.professor}/privado/vinculos`, { responsaveisIds: [uid.academia] });

  par(`usuarios/${uid.aluno}`, {
    id: uid.aluno, nome: CONTAS.aluno.nome, perfil: 'aluno',
    modalidades: [MODALIDADE], faixaOuGrau: 'Faixa azul', graduacoes: { [MODALIDADE]: 'Faixa azul' },
    participaClassificacao: true, criadoEm: agoraTs, atualizadoEm: agoraTs,
  });
  par(`usuarios/${uid.aluno}/privado/dados`, {
    email: CONTAS.aluno.email, dataNascimento: ts(new Date(1998, 4, 14)),
  });
  par(`usuarios/${uid.aluno}/privado/vinculos`, { responsaveisIds: [uid.academia] });

  // ---------- vínculos (RF07, RF08) ----------
  const criadoVinculo = ts(new Date(agora.getTime() - 60 * 86_400_000));
  par(`vinculos/${uid.professor}_${uid.academia}`, {
    id: `${uid.professor}_${uid.academia}`, solicitanteId: uid.professor, destinatarioId: uid.academia,
    perfilSolicitante: 'professor', perfilDestinatario: 'academia', tipo: 'professor-academia',
    status: 'aceito', criadoEm: criadoVinculo, respondidoEm: criadoVinculo,
  });
  par(`vinculos/${uid.aluno}_${uid.academia}`, {
    id: `${uid.aluno}_${uid.academia}`, solicitanteId: uid.aluno, destinatarioId: uid.academia,
    perfilSolicitante: 'aluno', perfilDestinatario: 'academia', tipo: 'aluno-academia',
    status: 'aceito', criadoEm: criadoVinculo, respondidoEm: criadoVinculo,
  });

  // ---------- turmas (RF10), matrícula (RF11), sessões (RF12) ----------
  const turmas = [
    { id: 'demo-turma-iniciante', nome: 'Jiu-Jitsu Iniciante', nivel: 'iniciante', diasSemana: [1, 3, 5], horarioInicio: '19:00', horarioFim: '20:30', matricula: true },
    { id: 'demo-turma-avancado', nome: 'Jiu-Jitsu Avançado', nivel: 'avancado', diasSemana: [2, 4], horarioInicio: '20:30', horarioFim: '22:00', matricula: false },
  ];
  const checkinsValidados = [];

  for (const t of turmas) {
    par(`turmas/${t.id}`, {
      id: t.id, nome: t.nome, modalidade: MODALIDADE, nivel: t.nivel,
      responsavelId: uid.academia, responsavelPerfil: 'academia', professorId: uid.professor,
      diasSemana: t.diasSemana, horarioInicio: t.horarioInicio, horarioFim: t.horarioFim,
      ativa: true, criadoEm: criadoVinculo, atualizadoEm: agoraTs,
    });
    if (t.matricula) {
      par(`matriculas/${t.id}_${uid.aluno}`, {
        id: `${t.id}_${uid.aluno}`, turmaId: t.id, alunoId: uid.aluno, responsavelId: uid.academia,
        status: 'ativa', criadoEm: criadoVinculo, atualizadoEm: criadoVinculo,
      });
    }

    // 4 semanas para trás e 2 para frente, nos dias da grade da turma
    let indicePassada = 0;
    for (let delta = -28; delta <= 14; delta += 1) {
      const base = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + delta);
      if (!t.diasSemana.includes(base.getDay())) continue;
      const inicio = comHorario(base, t.horarioInicio);
      const fim = comHorario(base, t.horarioFim);
      const passada = fim < agora;
      const sessaoId = `${t.id}_${dia(base)}`;
      par(`sessoes/${sessaoId}`, {
        id: sessaoId, turmaId: t.id, responsavelId: uid.academia, professorId: uid.professor,
        inicio: ts(inicio), fim: ts(fim),
        janelaCheckInInicio: ts(new Date(inicio.getTime() - 30 * 60_000)), janelaCheckInFim: ts(fim),
        status: passada ? 'encerrada' : 'agendada',
        // alunos matriculados entram em leitoresIds (a Cloud Function sincronizaria o mesmo)
        leitoresIds: t.matricula ? [uid.academia, uid.professor, uid.aluno] : [uid.academia, uid.professor],
        criadoEm: criadoVinculo, atualizadoEm: agoraTs,
      });
      if (passada && t.matricula) {
        indicePassada += 1;
        // falta de 1 em cada 5 aulas, para a frequência não ficar perfeita demais
        if (indicePassada % 5 !== 0) checkinsValidados.push({ sessaoId, turmaId: t.id, inicio });
      }
    }
  }

  // ---------- check-ins validados (RF13, RN01) e classificação mensal (RF20, RN04) ----------
  const pontosPorPeriodo = {};
  for (const c of checkinsValidados) {
    const periodo = periodoDe(c.inicio);
    pontosPorPeriodo[periodo] = (pontosPorPeriodo[periodo] || 0) + XP_POR_CHECKIN;
    const classificacaoId = `${uid.aluno}_${uid.academia}_${periodo}`;
    par(`checkins/${c.sessaoId}_${uid.aluno}`, {
      id: `${c.sessaoId}_${uid.aluno}`, sessaoId: c.sessaoId, turmaId: c.turmaId, alunoId: uid.aluno,
      responsavelId: uid.academia, dataHora: ts(new Date(c.inicio.getTime() - 10 * 60_000)),
      status: 'validado', pontos: XP_POR_CHECKIN, validadoPor: uid.professor,
      validadoEm: ts(new Date(c.inicio.getTime() + 90 * 60_000)), classificacaoId,
    });
  }
  for (const [periodo, pontos] of Object.entries(pontosPorPeriodo)) {
    par(`classificacoes/${uid.aluno}_${uid.academia}_${periodo}`, {
      id: `${uid.aluno}_${uid.academia}_${periodo}`, alunoId: uid.aluno, responsavelId: uid.academia,
      periodo, pontos, leitoresIds: [uid.academia, uid.aluno], atualizadoEm: agoraTs,
    });
  }

  // ---------- graduação (RF25, RN03) e missão (RF18, RF23) ----------
  par(`graduacoes/demo-graduacao-${uid.aluno}`, {
    id: `demo-graduacao-${uid.aluno}`, alunoId: uid.aluno, responsavelId: uid.academia,
    modalidade: MODALIDADE, grau: 'Faixa azul',
    dataGraduacao: ts(new Date(agora.getTime() - 90 * 86_400_000)),
    observacoes: 'Graduação na cerimônia do trimestre.', criadoEm: agoraTs,
  });
  par('missoes/demo-missao-presenca', {
    id: 'demo-missao-presenca', titulo: 'Maratona do tatame',
    descricao: 'Valide 12 treinos para ganhar pontos extras.', tipo: 'presenca', meta: 12, pontos: 50,
    responsavelId: uid.academia, ativa: true, criadoEm: agoraTs, atualizadoEm: agoraTs,
  });

  // ---------- gravação ----------
  console.log(`\n${docs.length} documentos (${checkinsValidados.length} check-ins validados):`);
  const resumo = {};
  docs.forEach(([caminho]) => { const c = caminho.split('/')[0]; resumo[c] = (resumo[c] || 0) + 1; });
  Object.entries(resumo).forEach(([c, n]) => console.log(`  ${c}: ${n}`));

  if (!aplicar) {
    console.log('\nDry-run: nada foi gravado. Rode de novo com --aplicar.');
  } else {
    for (let i = 0; i < docs.length; i += 400) {
      const lote = db.batch();
      docs.slice(i, i + 400).forEach(([caminho, dados]) => lote.set(db.doc(caminho), dados));
      // eslint-disable-next-line no-await-in-loop
      await lote.commit();
    }
    console.log('\nPronto. Contas demo (todas com a mesma senha):');
  }
  Object.values(CONTAS).forEach((c) => console.log(`  ${c.email}`));
  if (aplicar) console.log(`  senha: ${SENHA}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
