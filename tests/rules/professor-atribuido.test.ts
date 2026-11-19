// RF22, RF10: professor que a ACADEMIA atribuiu à turma vê as matrículas e os check-ins dela e valida
// presença. Roda as funções reais do app (listarMatriculasPorTurma, listarCheckInsPorSessao,
// validarCheckIn) sob as regras reais e tenta as fraudes: aluno dando `professorId` a alguém, check-in
// com escopo de outra academia, professor sem atribuição validando, pontos fora do valor do check-in.
// `professorId` nos documentos é o que a Cloud Function grava (aqui vem do seed).
jest.mock('../../src/services/firebase', () => ({ db: {} }));

import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, comoUsuario, semear,
  usuarioBase, vinculosPrivadoBase, turmaBase, matriculaBase, sessaoBase, checkinBase, AGORA,
} from './helpers';
import { listarMatriculasPorTurma } from '../../src/services/matriculas';
import { listarCheckInsPorSessao, validarCheckIn } from '../../src/services/checkins';
import { periodoDe } from '../../src/utils/datas';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

const CLASSIFICACAO = () => `aluno1_academia1_${periodoDe(new Date())}`;

// academia1 tem a turma t1 (professor atribuído: prof1) e a turma t2 (professor atribuído: prof2)
async function semearCenario() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'prof1'), usuarioBase({ perfil: 'professor' }));
    await setDoc(doc(db, 'usuarios', 'prof2'), usuarioBase({ perfil: 'professor' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
    // a academia só atribui professor com vínculo aceito com ela
    await setDoc(doc(db, 'usuarios', 'prof1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
    await setDoc(doc(db, 'usuarios', 'prof2', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
    await setDoc(doc(db, 'turmas', 't1'), turmaBase('academia1', 'academia', { id: 't1', professorId: 'prof1' }));
    await setDoc(doc(db, 'turmas', 't2'), turmaBase('academia1', 'academia', { id: 't2', professorId: 'prof2' }));
    for (const t of ['t1', 't2']) {
      const professorId = t === 't1' ? 'prof1' : 'prof2';
      await setDoc(doc(db, 'matriculas', `${t}_aluno1`), matriculaBase(t, 'aluno1', 'academia1', { id: `${t}_aluno1`, professorId }));
      await setDoc(doc(db, 'sessoes', `s_${t}`), sessaoBase(t, 'academia1', professorId, { leitoresIds: ['academia1', professorId, 'aluno1'] }));
      await setDoc(doc(db, 'checkins', `s_${t}_aluno1`), checkinBase(`s_${t}`, t, 'aluno1', 'academia1', { id: `s_${t}_aluno1`, professorId }));
    }
  });
}

describe('professor atribuído: leitura (RF22)', () => {
  test('vê as matrículas e os check-ins da turma dele, e só dela', async () => {
    await semearCenario();
    const dbProf1 = comoUsuario('prof1') as any;
    const matriculas = await listarMatriculasPorTurma('t1', 'prof1', dbProf1);
    expect(matriculas.map((m) => m.alunoId)).toEqual(['aluno1']);
    expect(await listarMatriculasPorTurma('t2', 'prof1', dbProf1)).toEqual([]);
    expect((await listarCheckInsPorSessao('s_t1', 'prof1', dbProf1)).map((c) => c.alunoId)).toEqual(['aluno1']);
    expect(await listarCheckInsPorSessao('s_t2', 'prof1', dbProf1)).toEqual([]);
  });

  test('a academia (responsável) continua vendo tudo, pela consulta por responsavelId', async () => {
    await semearCenario();
    const dbAcademia = comoUsuario('academia1') as any;
    expect(await listarMatriculasPorTurma('t1', 'academia1', dbAcademia)).toHaveLength(1);
    expect(await listarCheckInsPorSessao('s_t2', 'academia1', dbAcademia)).toHaveLength(1);
  });

  test('professor sem atribuição a essa turma não lê a matrícula nem o check-in', async () => {
    await semearCenario();
    await assertFails(getDoc(doc(comoUsuario('prof2'), 'matriculas', 't1_aluno1')));
    await assertFails(getDoc(doc(comoUsuario('prof2'), 'checkins', 's_t1_aluno1')));
  });
});

describe('professorId é só do servidor (RF22)', () => {
  test('aluno não cria a matrícula nem o check-in já com professorId', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'turmas', 't3'), turmaBase('academia1', 'academia', { id: 't3', professorId: 'prof1' }));
      await setDoc(doc(db, 'sessoes', 's_t3'), sessaoBase('t3', 'academia1', 'prof1', { leitoresIds: ['academia1', 'prof1', 'aluno1'] }));
    });
    const aluno = comoUsuario('aluno1');
    const matricula = matriculaBase('t3', 'aluno1', 'academia1', { id: 't3_aluno1' });
    await assertFails(setDoc(doc(aluno, 'matriculas', 't3_aluno1'), { ...matricula, professorId: 'prof2' }));
    await assertSucceeds(setDoc(doc(aluno, 'matriculas', 't3_aluno1'), matricula));

    const checkin = checkinBase('s_t3', 't3', 'aluno1', 'academia1', { id: 's_t3_aluno1' });
    await assertFails(setDoc(doc(aluno, 'checkins', 's_t3_aluno1'), { ...checkin, professorId: 'prof2' }));
    await assertSucceeds(setDoc(doc(aluno, 'checkins', 's_t3_aluno1'), checkin));
  });

  test('aluno não altera nem apaga o professorId da própria matrícula', async () => {
    await semearCenario();
    const aluno = comoUsuario('aluno1');
    await assertFails(updateDoc(doc(aluno, 'matriculas', 't1_aluno1'), { professorId: 'prof2' }));
    await assertFails(setDoc(doc(aluno, 'matriculas', 't1_aluno1'), matriculaBase('t1', 'aluno1', 'academia1', { id: 't1_aluno1' })));
    await assertSucceeds(updateDoc(doc(aluno, 'matriculas', 't1_aluno1'), { status: 'inativa' }));
  });

  test('check-in com responsavelId de outra academia é negado (escopo é o da turma)', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'sessoes', 's_novo'), sessaoBase('t1', 'academia1', 'prof1', { leitoresIds: ['academia1', 'prof1', 'aluno1'] }));
    });
    await assertFails(setDoc(
      doc(comoUsuario('aluno1'), 'checkins', 's_novo_aluno1'),
      checkinBase('s_novo', 't1', 'aluno1', 'academia2', { id: 's_novo_aluno1' }),
    ));
  });
});

describe('professor atribuído valida presença (RF22, RN01)', () => {
  test('valida: o check-in vale os pontos e a classificação da ACADEMIA recebe o crédito', async () => {
    await semearCenario();
    await validarCheckIn('s_t1_aluno1', 'prof1', 'validado', comoUsuario('prof1') as any);

    let dados: Record<string, any> | undefined;
    let classificacao: Record<string, any> | undefined;
    await semear(async (db) => {
      dados = (await getDoc(doc(db, 'checkins', 's_t1_aluno1'))).data();
      classificacao = (await getDoc(doc(db, 'classificacoes', CLASSIFICACAO()))).data();
    });
    expect(dados).toMatchObject({ status: 'validado', pontos: 10, validadoPor: 'prof1' });
    expect(classificacao).toMatchObject({ alunoId: 'aluno1', responsavelId: 'academia1', pontos: 10 });
  });

  test('desfaz a validação: o estorno devolve os pontos', async () => {
    await semearCenario();
    const dbProf = comoUsuario('prof1') as any;
    await validarCheckIn('s_t1_aluno1', 'prof1', 'validado', dbProf);
    await validarCheckIn('s_t1_aluno1', 'prof1', 'pendente', dbProf);
    let classificacao: Record<string, any> | undefined;
    let pontos: number | undefined;
    await semear(async (db) => {
      classificacao = (await getDoc(doc(db, 'classificacoes', CLASSIFICACAO()))).data();
      pontos = (await getDoc(doc(db, 'checkins', 's_t1_aluno1'))).data()?.pontos;
    });
    expect(pontos).toBe(0);
    expect(classificacao?.pontos).toBe(0);
  });

  test('professor atribuído a OUTRA turma não valida o check-in desta', async () => {
    await semearCenario();
    await expect(validarCheckIn('s_t1_aluno1', 'prof2', 'validado', comoUsuario('prof2') as any)).rejects.toBeDefined();
  });

  test('professor sem nenhuma atribuição não valida', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'prof3'), usuarioBase({ perfil: 'professor' }));
    });
    await expect(validarCheckIn('s_t1_aluno1', 'prof3', 'validado', comoUsuario('prof3') as any)).rejects.toBeDefined();
  });

  test('a academia (responsável) continua validando como antes', async () => {
    await semearCenario();
    await validarCheckIn('s_t1_aluno1', 'academia1', 'validado', comoUsuario('academia1') as any);
    let pontos: number | undefined;
    await semear(async (db) => {
      pontos = (await getDoc(doc(db, 'checkins', 's_t1_aluno1'))).data()?.pontos;
    });
    expect(pontos).toBe(10);
  });

  test('RN01 intacta: o professor não escreve pontos fora do valor do check-in, direto nos documentos', async () => {
    await semearCenario();
    const prof = comoUsuario('prof1');
    await assertFails(updateDoc(doc(prof, 'checkins', 's_t1_aluno1'), { status: 'validado', pontos: 999 }));
    await assertFails(updateDoc(doc(prof, 'checkins', 's_t1_aluno1'), { status: 'validado', pontos: 10 }));
    await assertFails(setDoc(doc(prof, 'classificacoes', CLASSIFICACAO()), {
      id: CLASSIFICACAO(), alunoId: 'aluno1', responsavelId: 'academia1', periodo: periodoDe(new Date()),
      pontos: 500, origemCheckinId: 's_t1_aluno1', atualizadoEm: AGORA,
    }));
  });

  test('o professor não credita pontos usando um check-in de turma que não é dele', async () => {
    await semearCenario();
    const prof1 = comoUsuario('prof1');
    // s_t2_aluno1 é da turma t2 (professor atribuído: prof2)
    await assertFails(updateDoc(doc(prof1, 'checkins', 's_t2_aluno1'), { status: 'validado', pontos: 10 }));
    await assertFails(setDoc(doc(prof1, 'classificacoes', CLASSIFICACAO()), {
      id: CLASSIFICACAO(), alunoId: 'aluno1', responsavelId: 'academia1', periodo: periodoDe(new Date()),
      pontos: 10, origemCheckinId: 's_t2_aluno1', atualizadoEm: AGORA,
    }));
  });
});

describe('leitura da classificação por get (RF22)', () => {
  async function semearClassificacao() {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'prof3'), usuarioBase({ perfil: 'professor' }));
      await setDoc(doc(db, 'usuarios', 'aluno2'), usuarioBase({ perfil: 'aluno' }));
      await setDoc(doc(db, 'classificacoes', CLASSIFICACAO()), {
        id: CLASSIFICACAO(), alunoId: 'aluno1', responsavelId: 'academia1', periodo: periodoDe(new Date()), pontos: 10, atualizadoEm: AGORA,
      });
    });
  }

  test('professor com vínculo com a academia lê por id; sem vínculo e outro aluno não', async () => {
    await semearClassificacao();
    await assertSucceeds(getDoc(doc(comoUsuario('prof1'), 'classificacoes', CLASSIFICACAO())));
    await assertFails(getDoc(doc(comoUsuario('prof3'), 'classificacoes', CLASSIFICACAO())));
    await assertFails(getDoc(doc(comoUsuario('aluno2'), 'classificacoes', CLASSIFICACAO())));
  });

  test('a lista (ranking) continua fechada ao professor: ele não varre as classificações da academia', async () => {
    await semearClassificacao();
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    await assertFails(getDocs(query(collection(comoUsuario('prof1'), 'classificacoes'), where('responsavelId', '==', 'academia1'))));
  });
});
