// Contas das PERSONAS da apresentação da defesa, com o histórico que cada cenário precisa:
//   - Cenário 1, Marina (aluna iniciante, primeira semana de Jiu-Jitsu, faixa branca);
//   - Cenário 2, Davi (16 anos, 1 ano de Jiu-Jitsu, faixa branca 3º grau — menor, com responsável legal, RF30);
//   - Cenário 3, Felipe (professor de Muay Thai vinculado à academia, RF07) e a academia do Cláudio, que
//     faz a gestão (alunos e alerta de queda, RF24/RF32; graduação, RF25; missões, RF23).
// Felipe não tem relação com Marina e Davi: dá a turma de Muay Thai, com alunos de apoio próprios.
// Alunos de apoio (só Firestore, sem login) completam turmas de tamanho real (12 a 14 alunos) e dão
// corpo ao ranking (RF20), às chamadas (RF22) e ao alerta de queda de frequência (RF32: Gabriel e
// Leonardo vieram uma vez e sumiram).
//
// Idempotente: ids determinísticos e datas relativas a "agora". Rode de novo no dia da defesa para
// renovar a agenda (o histórico de check-ins é refeito em relação à nova data).
//
// "Aulas da demonstração": no dia DEMO_DATA (padrão: hoje) o script cria uma sessão de dia inteiro
// (07:00 às 23:00) na turma de Jiu-Jitsu Iniciante (check-in ao vivo da Marina, RN08) e outra na de
// Muay Thai, com 5 check-ins pendentes para o Felipe confirmar na chamada. Aulas da demonstração de
// datas anteriores são canceladas, para não quebrarem a sequência (RF21) de quem faltou.
//
// Uso (credenciais Admin: GOOGLE_APPLICATION_CREDENTIALS apontando para a chave de uma conta de
// serviço do projeto, ou `gcloud auth application-default login`):
//   node scripts/seed-personas.cjs                         # dry-run: só mostra o que faria
//   node scripts/seed-personas.cjs --aplicar               # grava no projeto roundup-app-a5a82
//   DEMO_DATA=2026-11-23 node scripts/seed-personas.cjs --aplicar
// Variáveis opcionais: DEMO_SENHA (padrão abaixo), GCLOUD_PROJECT (ex.: demo-roundup-app com os
// emuladores, que também exigem FIRESTORE_EMULATOR_HOST e FIREBASE_AUTH_EMULATOR_HOST).
const path = require('path');
const requireDeFunctions = require('module').createRequire(path.join(__dirname, '../functions/package.json'));
const { initializeApp } = requireDeFunctions('firebase-admin/app');
const { getAuth } = requireDeFunctions('firebase-admin/auth');
const { getFirestore, Timestamp } = requireDeFunctions('firebase-admin/firestore');

const aplicar = process.argv.includes('--aplicar');
const SENHA = process.env.DEMO_SENHA || 'Demo@2026';
const PROJETO = process.env.GCLOUD_PROJECT || 'roundup-app-a5a82';
const XP_POR_CHECKIN = 10; // == XP_POR_CHECKIN_VALIDADO em src/config/gamificacao.ts (RF16)
const DIA_MS = 86_400_000;
// Espera entre gravar as graduações e gravar os perfis: aplicarGraduacaoNoPerfil (Cloud Function)
// projeta cada graduação no perfil sem olhar a data, então o perfil final é regravado depois dela.
const ESPERA_FUNCOES_MS = Number(process.env.ESPERA_FUNCOES_MS ?? 20_000);

// example.com é domínio reservado (RFC 2606): nenhum e-mail real recebe nada
const CONTAS = {
  academia: { email: 'academia.arena@example.com', nome: 'Cláudio Ribeiro' },
  felipe: { email: 'felipe.professor@example.com', nome: 'Felipe Moraes' },
  marina: { email: 'marina.aluna@example.com', nome: 'Marina Alves' },
  davi: { email: 'davi.aluno@example.com', nome: 'Davi Santos' },
};

// MARCOS_MEDALHAS de src/config/gamificacao.ts (RF19) — os ids são os mesmos da Cloud Function
const MARCOS = [
  { id: 'treinos-10', rotulo: '10 treinos', tipo: 'treinos', quantidade: 10 },
  { id: 'treinos-30', rotulo: '30 treinos', tipo: 'treinos', quantidade: 30 },
  { id: 'treinos-100', rotulo: '100 treinos', tipo: 'treinos', quantidade: 100 },
  { id: 'sequencia-7', rotulo: '7 treinos seguidos', tipo: 'sequencia', quantidade: 7 },
  { id: 'sequencia-30', rotulo: '30 treinos seguidos', tipo: 'sequencia', quantidade: 30 },
];

const ts = (d) => Timestamp.fromDate(d);
const periodoDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const dia = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function comHorario(base, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function dataDemo(agora) {
  const texto = process.env.DEMO_DATA;
  if (!texto) return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) throw new Error(`DEMO_DATA inválida: "${texto}" (use AAAA-MM-DD)`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
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
  const agora = new Date();
  const agoraTs = ts(agora);
  const demo = dataDemo(agora);
  console.log(`Projeto: ${PROJETO} (${aplicar ? 'APLICAR' : 'dry-run, nada é gravado'})`);
  console.log(`Aulas da demonstração em ${demo.toLocaleDateString('pt-BR')}, das 07:00 às 23:00`);
  initializeApp({ projectId: PROJETO });
  const auth = getAuth();
  const db = getFirestore();

  // ---------- contas (RF01) ----------
  const uid = aplicar
    ? Object.fromEntries(await Promise.all(Object.entries(CONTAS).map(async ([k, c]) => [k, await garantirContaAuth(auth, c)])))
    : { academia: 'UID_ACADEMIA', felipe: 'UID_FELIPE', marina: 'UID_MARINA', davi: 'UID_DAVI' };
  const ACADEMIA = uid.academia;

  // ---------- turmas (RF10) ----------
  // professorId ausente = a própria academia ministra e valida (sessão usa o responsável, como o app)
  const TURMAS = {
    iniciante: { id: 'personas-turma-jj-iniciante', nome: 'Jiu-Jitsu Iniciante', modalidade: 'Jiu-Jitsu', nivel: 'iniciante', diasSemana: [1, 3, 5], inicio: '19:00', fim: '20:30', historicoDias: 42 },
    adulto: { id: 'personas-turma-jj-adulto', nome: 'Jiu-Jitsu Adulto', modalidade: 'Jiu-Jitsu', nivel: 'intermediario', diasSemana: [2, 4], inicio: '20:00', fim: '21:30', historicoDias: 370 },
    muayThai: { id: 'personas-turma-muay-thai', nome: 'Muay Thai', modalidade: 'Muay Thai', nivel: 'iniciante', diasSemana: [2, 4], inicio: '19:00', fim: '20:30', historicoDias: 42, professorId: uid.felipe },
  };

  // ---------- alunos (RF06) ----------
  // entrouHaDias: matrícula e vínculo; falta(i): i = índice da aula passada a partir da mais recente
  const ALUNOS = [
    { chave: 'marina', id: uid.marina, nome: CONTAS.marina.nome, turma: 'iniciante', faixa: 'branca', grau: 0, entrouHaDias: 7, falta: () => false,
      nascimento: new Date(2004, 2, 10), email: CONTAS.marina.email },
    // Davi: 1 ano, últimas 12 aulas seguidas e antes disso 1 falta a cada 5 (≈ 85 treinos, nível 5)
    { chave: 'davi', id: uid.davi, nome: CONTAS.davi.nome, turma: 'adulto', faixa: 'branca', grau: 3, entrouHaDias: 365, falta: (i) => i >= 12 && i % 5 === 2,
      nascimento: new Date(2010, 5, 2), email: CONTAS.davi.email,
      responsavelLegal: { nome: 'Patrícia Santos', contato: 'responsavel.davi@example.com' } },
    { chave: 'bruno', id: 'personas-aluno-bruno', nome: 'Bruno Lima', turma: 'iniciante', faixa: 'branca', grau: 1, entrouHaDias: 35, falta: (i) => i % 6 === 3 },
    { chave: 'carla', id: 'personas-aluno-carla', nome: 'Carla Nunes', turma: 'iniciante', faixa: 'branca', grau: 0, entrouHaDias: 21, falta: (i) => i % 3 === 1 },
    { chave: 'rafael', id: 'personas-aluno-rafael', nome: 'Rafael Duarte', turma: 'adulto', faixa: 'azul', grau: 2, entrouHaDias: 42, falta: () => false },
    { chave: 'juliana', id: 'personas-aluno-juliana', nome: 'Juliana Prado', turma: 'adulto', faixa: 'branca', grau: 2, entrouHaDias: 42, falta: (i) => i % 4 === 1 },
    { chave: 'pedro', id: 'personas-aluno-pedro', nome: 'Pedro Nogueira', turma: 'adulto', faixa: 'roxa', grau: 0, entrouHaDias: 42, falta: (i) => i % 3 === 0 },
    { chave: 'ana', id: 'personas-aluno-ana', nome: 'Ana Rocha', turma: 'muayThai', faixa: 'amarela', grau: 0, entrouHaDias: 42, falta: (i) => i % 7 === 4, pendenteNaDemo: true },
    { chave: 'thiago', id: 'personas-aluno-thiago', nome: 'Thiago Mendes', turma: 'muayThai', faixa: 'laranja', grau: 0, entrouHaDias: 42, falta: (i) => i % 4 === 2, pendenteNaDemo: true },
    { chave: 'isabela', id: 'personas-aluno-isabela', nome: 'Isabela Cruz', turma: 'muayThai', faixa: 'branca', grau: 0, entrouHaDias: 28, falta: (i) => i % 5 === 0, pendenteNaDemo: true },
    // RF32: veio na primeira semana e sumiu — 1 check-in validado só, então aparece em queda
    { chave: 'gabriel', id: 'personas-aluno-gabriel', nome: 'Gabriel Torres', turma: 'muayThai', faixa: 'branca', grau: 0, entrouHaDias: 35, soPrimeiraAula: true },
    { chave: 'leonardo', id: 'personas-aluno-leonardo', nome: 'Leonardo Pires', turma: 'iniciante', faixa: 'branca', grau: 0, entrouHaDias: 24, soPrimeiraAula: true },
  ];
  // Turmas com tamanho de turma real: os demais alunos de apoio, com faixa, entrada e frequência
  // sorteadas de forma determinística (a mesma semente dá sempre o mesmo resultado)
  const EXTRAS = {
    iniciante: { nomes: ['Beatriz Ramos', 'Mateus Carvalho', 'Larissa Gomes', 'Henrique Barros', 'Sofia Martins', 'Caio Teixeira', 'Yasmin Freitas', 'Diego Araújo'],
      faixas: [['branca', 0], ['branca', 0], ['branca', 1], ['branca', 2]], entrada: [10, 42] },
    adulto: { nomes: ['Mariana Lopes', 'Gustavo Almeida', 'Fernanda Castro', 'João Vitor Rezende', 'Camila Dias', 'Eduardo Pacheco', 'Letícia Moura', 'Rodrigo Farias', 'Natália Brito', 'Vinícius Campos'],
      faixas: [['branca', 3], ['branca', 4], ['azul', 0], ['azul', 1], ['azul', 3], ['roxa', 1], ['marrom', 0]], entrada: [42, 42] },
    muayThai: { nomes: ['Paulo Neves', 'Renata Lima', 'Marcos Vieira', 'Priscila Antunes', 'Daniel Cunha', 'Tatiane Sales', 'Igor Batista', 'Aline Queiroz'],
      faixas: [['branca', 0], ['amarela', 0], ['laranja', 0], ['verde', 0]], entrada: [14, 42], pendentes: 2 },
  };
  const sorteio = (texto) => { // hash FNV-1a + mistura final (fmix32) → [0, 1)
    let h = 2166136261;
    for (const c of texto) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const slug = (nome) => nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, '-');
  for (const [turma, cfg] of Object.entries(EXTRAS)) {
    cfg.nomes.forEach((nome, n) => {
      const chave = slug(nome);
      const [faixa, grau] = cfg.faixas[Math.floor(sorteio(`${chave}-faixa`) * cfg.faixas.length)];
      const taxa = 0.55 + 0.4 * sorteio(`${chave}-taxa`); // presença entre 55% e 95%
      ALUNOS.push({
        chave, id: `personas-aluno-${chave}`, nome, turma, faixa, grau,
        entrouHaDias: Math.round(cfg.entrada[0] + (cfg.entrada[1] - cfg.entrada[0]) * sorteio(`${chave}-entrada`)),
        falta: (i) => sorteio(`${chave}-${i}`) > taxa,
        pendenteNaDemo: n < (cfg.pendentes ?? 0),
      });
    });
  }
  const NOME_FAIXA = { branca: 'Branca', amarela: 'Amarela', laranja: 'Laranja', verde: 'Verde', azul: 'Azul', roxa: 'Roxa', marrom: 'Marrom' };
  const textoFaixa = (faixa, grau) => `Faixa ${faixa}${grau > 0 ? `, ${grau}º grau` : ''}`;

  const docs = []; // [caminho, dados]
  const par = (caminho, dados) => docs.push([caminho, dados]);
  const graduacoesDocs = []; // gravadas antes de tudo (ver ESPERA_FUNCOES_MS)

  // ---------- academia e professor (RF04, RF05, RF07, RN06) ----------
  const haUmAno = new Date(agora.getTime() - 400 * DIA_MS);
  par(`usuarios/${ACADEMIA}`, {
    id: ACADEMIA, nome: CONTAS.academia.nome, perfil: 'academia', nomeAcademia: 'Academia Arena Tatame',
    endereco: 'Rua do Tatame, 45 - Centro', modalidades: ['Jiu-Jitsu', 'Muay Thai'],
    criadoEm: ts(haUmAno), atualizadoEm: agoraTs,
  });
  par(`usuarios/${ACADEMIA}/privado/dados`, { email: CONTAS.academia.email });

  par(`usuarios/${uid.felipe}`, {
    id: uid.felipe, nome: CONTAS.felipe.nome, perfil: 'professor', autonomo: false,
    modalidades: ['Muay Thai'], graduacao: 'Faixa preta', criadoEm: ts(haUmAno), atualizadoEm: agoraTs,
  });
  par(`usuarios/${uid.felipe}/privado/dados`, { email: CONTAS.felipe.email });
  par(`usuarios/${uid.felipe}/privado/vinculos`, { responsaveisIds: [ACADEMIA] });
  par(`vinculos/${uid.felipe}_${ACADEMIA}`, {
    id: `${uid.felipe}_${ACADEMIA}`, solicitanteId: uid.felipe, destinatarioId: ACADEMIA,
    perfilSolicitante: 'professor', perfilDestinatario: 'academia', tipo: 'professor-academia',
    status: 'aceito', criadoEm: ts(haUmAno), respondidoEm: ts(haUmAno),
  });

  for (const t of Object.values(TURMAS)) {
    par(`turmas/${t.id}`, {
      id: t.id, nome: t.nome, modalidade: t.modalidade, nivel: t.nivel,
      responsavelId: ACADEMIA, responsavelPerfil: 'academia', ...(t.professorId ? { professorId: t.professorId } : {}),
      diasSemana: t.diasSemana, horarioInicio: t.inicio, horarioFim: t.fim,
      ativa: true, criadoEm: ts(haUmAno), atualizadoEm: agoraTs,
    });
  }

  // ---------- alunos: perfil, dados privados, vínculo e matrícula (RF06, RF08, RF11, RF30, RN05) ----------
  const todosAlunos = ALUNOS.map((a) => a.id);
  for (const a of ALUNOS) {
    const t = TURMAS[a.turma];
    const entrou = new Date(agora.getTime() - a.entrouHaDias * DIA_MS);
    const texto = textoFaixa(a.faixa, a.grau);
    a.entrou = entrou;
    a.usuario = {
      id: a.id, nome: a.nome, perfil: 'aluno', modalidades: [t.modalidade], faixaOuGrau: texto,
      graduacoes: { [t.modalidade]: texto },
      faixasEstruturadas: { [t.modalidade]: { faixaId: a.faixa, faixa: NOME_FAIXA[a.faixa], cor: a.faixa, grau: a.grau } },
      participaClassificacao: true, criadoEm: ts(entrou), atualizadoEm: agoraTs,
    };
    par(`usuarios/${a.id}/privado/dados`, {
      email: a.email ?? `${a.chave}.apoio@example.com`,
      ...(a.nascimento ? { dataNascimento: ts(a.nascimento) } : {}),
      ...(a.responsavelLegal ? { responsavelLegal: a.responsavelLegal } : {}),
    });
    par(`usuarios/${a.id}/privado/vinculos`, { responsaveisIds: [ACADEMIA] });
    par(`vinculos/${a.id}_${ACADEMIA}`, {
      id: `${a.id}_${ACADEMIA}`, solicitanteId: a.id, destinatarioId: ACADEMIA,
      perfilSolicitante: 'aluno', perfilDestinatario: 'academia', tipo: 'aluno-academia',
      status: 'aceito', criadoEm: ts(entrou), respondidoEm: ts(entrou),
    });
    par(`matriculas/${t.id}_${a.id}`, {
      id: `${t.id}_${a.id}`, turmaId: t.id, alunoId: a.id, responsavelId: ACADEMIA,
      ...(t.professorId ? { professorId: t.professorId } : {}),
      status: 'ativa', criadoEm: ts(entrou), atualizadoEm: ts(entrou),
    });
  }

  // ---------- sessões (RF12, RN07, RN08) ----------
  const sessoesPorTurma = {};
  for (const [chave, t] of Object.entries(TURMAS)) {
    const matriculados = ALUNOS.filter((a) => a.turma === chave).map((a) => a.id);
    const professor = t.professorId ?? ACADEMIA;
    const leitoresIds = [...new Set([ACADEMIA, professor, ...matriculados])];
    sessoesPorTurma[chave] = [];
    for (let delta = -t.historicoDias; delta <= 14; delta += 1) {
      const base = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + delta);
      if (!t.diasSemana.includes(base.getDay())) continue;
      // no dia da demonstração a aula de dia inteiro substitui a aula da grade (iniciante e Muay Thai)
      if (dia(base) === dia(demo) && chave !== 'adulto') continue;
      const inicio = comHorario(base, t.inicio);
      const fim = comHorario(base, t.fim);
      const id = `${t.id}_${dia(base)}`;
      const passada = fim < agora;
      par(`sessoes/${id}`, {
        id, turmaId: t.id, responsavelId: ACADEMIA, professorId: professor, inicio: ts(inicio), fim: ts(fim),
        janelaCheckInInicio: ts(new Date(inicio.getTime() - 30 * 60_000)), janelaCheckInFim: ts(fim),
        status: passada ? 'encerrada' : 'agendada', leitoresIds, criadoEm: ts(haUmAno), atualizadoEm: agoraTs,
      });
      if (passada) sessoesPorTurma[chave].push({ id, inicio, turmaId: t.id, professor });
    }
    if (chave !== 'adulto') {
      const inicio = comHorario(demo, '07:00');
      const fim = comHorario(demo, '23:00');
      const id = `${t.id}_demo_${dia(demo)}`;
      t.sessaoDemo = { id, inicio, professor };
      par(`sessoes/${id}`, {
        id, turmaId: t.id, responsavelId: ACADEMIA, professorId: professor, inicio: ts(inicio), fim: ts(fim),
        janelaCheckInInicio: ts(new Date(inicio.getTime() - 30 * 60_000)), janelaCheckInFim: ts(fim),
        status: 'agendada', descricao: 'Aula da demonstração', leitoresIds, criadoEm: agoraTs, atualizadoEm: agoraTs,
      });
    }
  }

  // ---------- check-ins validados (RF13, RF22, RN01, RN02) ----------
  const validadosPorAluno = {};
  for (const a of ALUNOS) {
    const aulas = sessoesPorTurma[a.turma].filter((s) => s.inicio >= a.entrou).sort((x, y) => y.inicio - x.inicio);
    const presentes = a.soPrimeiraAula ? aulas.slice(-1) : aulas.filter((_, i) => !a.falta(i));
    validadosPorAluno[a.id] = { aulas, presentes: presentes.sort((x, y) => x.inicio - y.inicio) };
    for (const s of presentes) {
      const periodo = periodoDe(s.inicio);
      par(`checkins/${s.id}_${a.id}`, {
        id: `${s.id}_${a.id}`, sessaoId: s.id, turmaId: s.turmaId, alunoId: a.id, responsavelId: ACADEMIA,
        ...(TURMAS[a.turma].professorId ? { professorId: TURMAS[a.turma].professorId } : {}),
        dataHora: ts(new Date(s.inicio.getTime() - 10 * 60_000)), status: 'validado', pontos: XP_POR_CHECKIN,
        validadoPor: s.professor, validadoEm: ts(new Date(s.inicio.getTime() + 90 * 60_000)),
        classificacaoId: `${a.id}_${ACADEMIA}_${periodo}`,
      });
    }
  }

  // check-ins pendentes na aula de Muay Thai da demonstração: o Felipe confirma na chamada (RF22)
  const mt = TURMAS.muayThai;
  for (const a of ALUNOS.filter((x) => x.pendenteNaDemo)) {
    par(`checkins/${mt.sessaoDemo.id}_${a.id}`, {
      id: `${mt.sessaoDemo.id}_${a.id}`, sessaoId: mt.sessaoDemo.id, turmaId: mt.id, alunoId: a.id,
      responsavelId: ACADEMIA, professorId: uid.felipe, dataHora: ts(new Date(mt.sessaoDemo.inicio.getTime() + 30 * 60_000)),
      status: 'pendente', pontos: 0,
    });
  }

  // ---------- classificação mensal (RF20, RN04, RN09, RNF11) ----------
  // leitoresIds como a Cloud Function definirLeitoresDaClassificacao: academia + alunos vinculados
  const leitoresRanking = [ACADEMIA, ...todosAlunos];
  for (const a of ALUNOS) {
    const pontosPorPeriodo = {};
    validadosPorAluno[a.id].presentes.forEach((s) => {
      const p = periodoDe(s.inicio);
      pontosPorPeriodo[p] = (pontosPorPeriodo[p] || 0) + XP_POR_CHECKIN;
    });
    for (const [periodo, pontos] of Object.entries(pontosPorPeriodo)) {
      par(`classificacoes/${a.id}_${ACADEMIA}_${periodo}`, {
        id: `${a.id}_${ACADEMIA}_${periodo}`, alunoId: a.id, responsavelId: ACADEMIA, periodo, pontos,
        leitoresIds: leitoresRanking, atualizadoEm: agoraTs,
      });
    }
  }

  // ---------- medalhas (RF19): mesmos marcos e ids da Cloud Function, com a data da conquista ----------
  for (const a of ALUNOS) {
    const { aulas, presentes } = validadosPorAluno[a.id];
    const presentesIds = new Set(presentes.map((s) => s.id));
    const conquistas = {};
    let total = 0;
    let seguidos = 0;
    [...aulas].sort((x, y) => x.inicio - y.inicio).forEach((s) => {
      if (!presentesIds.has(s.id)) { seguidos = 0; return; }
      total += 1;
      seguidos += 1;
      MARCOS.forEach((m) => {
        const valor = m.tipo === 'treinos' ? total : seguidos;
        if (!conquistas[m.id] && valor >= m.quantidade) conquistas[m.id] = { marco: m, quando: s.inicio };
      });
    });
    for (const { marco, quando } of Object.values(conquistas)) {
      par(`usuarios/${a.id}/medalhas/${marco.id}`, {
        id: marco.id, tipo: marco.tipo, quantidade: marco.quantidade, rotulo: marco.rotulo,
        conquistadaEm: ts(quando), origem: 'checkin', registradaEm: agoraTs,
      });
    }
    a.resumo = { treinos: total, seguidosAgora: seguidos, medalhas: Object.keys(conquistas) };
  }

  // ---------- graduações do Davi (RF25, RN03, RF33: estrutura padrão do Jiu-Jitsu, 4 graus) ----------
  const davi = ALUNOS.find((a) => a.chave === 'davi');
  [{ grau: 1, haDias: 270 }, { grau: 2, haDias: 180 }, { grau: 3, haDias: 60 }].forEach(({ grau, haDias }) => {
    const quando = new Date(agora.getTime() - haDias * DIA_MS);
    graduacoesDocs.push([`graduacoes/personas-graduacao-davi-${grau}`, {
      id: `personas-graduacao-davi-${grau}`, alunoId: davi.id, responsavelId: ACADEMIA, modalidade: 'Jiu-Jitsu',
      grau: textoFaixa('branca', grau), faixaId: 'branca', faixaNome: 'Branca', faixaCor: 'branca', grauNumero: grau,
      dataGraduacao: ts(quando), observacoes: `${grau}º grau na faixa branca.`, criadoEm: ts(quando),
    }]);
  });
  par(`usuarios/${davi.id}/medalhas/graduacoes-1`, {
    id: 'graduacoes-1', tipo: 'graduacoes', quantidade: 1, rotulo: 'Primeira graduação',
    conquistadaEm: ts(new Date(agora.getTime() - 270 * DIA_MS)), origem: 'graduacao', registradaEm: agoraTs,
  });
  davi.usuario.faixasEstruturadas['Jiu-Jitsu'].responsavelId = ACADEMIA;
  davi.resumo.medalhas.push('graduacoes-1');

  // perfis por último (depois das graduações, ver ESPERA_FUNCOES_MS)
  const perfis = ALUNOS.map((a) => [`usuarios/${a.id}`, a.usuario]);

  // ---------- missões do mês (RF18, RF23) e progresso ----------
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
  const MISSOES = [
    { id: 'personas-missao-fundamentos', titulo: 'Fundamentos do mês', descricao: 'Faça 12 treinos neste mês para pegar a base.', meta: 12, pontos: 50, turma: 'iniciante' },
    { id: 'personas-missao-constancia', titulo: 'Constância no tatame', descricao: 'Faça 10 treinos neste mês sem deixar a turma.', meta: 10, pontos: 60, turma: 'adulto' },
    { id: 'personas-missao-muay-thai', titulo: 'Mês do Muay Thai', descricao: 'Faça 8 treinos de Muay Thai neste mês.', meta: 8, pontos: 40, turma: 'muayThai' },
  ];
  for (const m of MISSOES) {
    const publico = ALUNOS.filter((a) => a.turma === m.turma).map((a) => a.id).sort();
    par(`missoes/${m.id}`, {
      id: m.id, titulo: m.titulo, descricao: m.descricao, tipo: 'presenca', meta: m.meta, pontos: m.pontos,
      responsavelId: ACADEMIA, ativa: true, publicoAlvo: 'turma', turmaId: TURMAS[m.turma].id,
      vigenciaInicio: ts(inicioMes), vigenciaFim: ts(fimMes),
      // campos de servidor já como a Cloud Function deixaria; alunosNotificadosIds evita aviso push
      leitoresIds: publico, situacao: 'vigente', alunosNotificadosIds: publico,
      criadoEm: ts(inicioMes), atualizadoEm: agoraTs,
    });
    for (const alunoId of publico) {
      const feitos = validadosPorAluno[alunoId].presentes.filter((s) => s.inicio >= inicioMes).length;
      // nunca concluída aqui: a conclusão credita pontos por Cloud Function (creditarPontosDaMissao)
      par(`missoesProgresso/${m.id}_${alunoId}`, {
        id: `${m.id}_${alunoId}`, missaoId: m.id, alunoId, responsavelId: ACADEMIA,
        progressoAtual: Math.min(feitos, m.meta - 1), concluida: false, atualizadoEm: agoraTs,
      });
    }
  }

  // ---------- resumo ----------
  const todos = [...graduacoesDocs, ...docs, ...perfis];
  console.log(`\n${todos.length} documentos:`);
  const porColecao = {};
  todos.forEach(([c]) => { const k = c.split('/').length > 2 ? `${c.split('/')[0]}/${c.split('/')[2]}` : c.split('/')[0]; porColecao[k] = (porColecao[k] || 0) + 1; });
  Object.entries(porColecao).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
  console.log('\nAlunos (treinos validados, sequência atual, medalhas):');
  ALUNOS.forEach((a) => console.log(`  ${a.nome.padEnd(16)} ${String(a.resumo.treinos).padStart(3)}  ${String(a.resumo.seguidosAgora).padStart(3)}  ${a.resumo.medalhas.join(', ')}`));

  if (!aplicar) {
    console.log('\nDry-run: nada foi gravado. Rode de novo com --aplicar.');
    return;
  }

  const gravar = async (lista) => {
    for (let i = 0; i < lista.length; i += 400) {
      const lote = db.batch();
      lista.slice(i, i + 400).forEach(([caminho, dados]) => lote.set(db.doc(caminho), dados));
      // eslint-disable-next-line no-await-in-loop
      await lote.commit();
    }
  };
  await gravar(graduacoesDocs);
  if (ESPERA_FUNCOES_MS > 0) {
    console.log(`\nGraduações gravadas; aguardando ${ESPERA_FUNCOES_MS / 1000}s as Cloud Functions...`);
    await dormir(ESPERA_FUNCOES_MS);
  }
  await gravar(docs);
  await gravar(perfis);

  // aulas da demonstração de outras datas: canceladas, para não quebrarem a sequência (RF21)
  let canceladas = 0;
  for (const t of [TURMAS.iniciante, TURMAS.muayThai]) {
    // eslint-disable-next-line no-await-in-loop
    const snap = await db.collection('sessoes').where('turmaId', '==', t.id).get();
    const antigas = snap.docs.filter((d) => d.id.includes('_demo_') && d.id !== t.sessaoDemo.id && d.data().status !== 'cancelada');
    for (const d of antigas) {
      // eslint-disable-next-line no-await-in-loop
      await d.ref.update({ status: 'cancelada', atualizadoEm: agoraTs });
      canceladas += 1;
    }
  }
  if (canceladas > 0) console.log(`${canceladas} aula(s) da demonstração de outras datas cancelada(s).`);

  console.log('\nPronto. Contas (todas com a mesma senha):');
  Object.entries(CONTAS).forEach(([k, c]) => console.log(`  ${k.padEnd(9)} ${c.email}`));
  console.log(`  senha: ${SENHA}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
