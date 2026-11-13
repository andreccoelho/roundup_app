// RF18: quem escreve missoesProgresso. O aluno nunca escreve o próprio progresso; o responsável
// só escreve progresso de missão personalizada dele, e nunca os campos de crédito de pontos
// (pontosCreditados/periodoCredito), que são da Cloud Function creditarPontosDaMissao.
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where,
} from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, comoUsuario, semear,
  usuarioBase, vinculosPrivadoBase, missaoBase, missaoAntigaBase, turmaBase, matriculaBase,
  minutosAPartirDeAgora, AGORA,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

function progressoBase(missaoId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `${missaoId}_aluno1`,
    missaoId,
    alunoId: 'aluno1',
    responsavelId: 'academia1',
    progressoAtual: 1,
    concluida: true,
    dataConclusao: AGORA,
    atualizadoEm: AGORA,
    ...overrides,
  };
}

async function semearCenario() {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1', 'academia2']));
    await setDoc(doc(db, 'missoes', 'personalizada1'), missaoBase('academia1', { tipo: 'personalizada', meta: 1 }));
    await setDoc(doc(db, 'missoes', 'presenca1'), missaoBase('academia1', { tipo: 'presenca' }));
  });
}

describe('missoesProgresso (RF18)', () => {
  test('aluno não cria o próprio progresso', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('aluno1'), 'missoesProgresso', 'personalizada1_aluno1'), progressoBase('personalizada1')));
  });

  test('aluno não atualiza o próprio progresso', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoesProgresso', 'presenca1_aluno1'), progressoBase('presenca1', { progressoAtual: 1, concluida: false }));
    });
    await assertFails(updateDoc(doc(comoUsuario('aluno1'), 'missoesProgresso', 'presenca1_aluno1'), { progressoAtual: 10, concluida: true }));
  });

  test('responsável marca a conclusão de missão personalizada dele', async () => {
    await semearCenario();
    await assertSucceeds(setDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'personalizada1_aluno1'), progressoBase('personalizada1')));
  });

  test('responsável desmarca a conclusão de missão personalizada', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoesProgresso', 'personalizada1_aluno1'), progressoBase('personalizada1', { pontosCreditados: 10, periodoCredito: '2026-11' }));
    });
    await assertSucceeds(updateDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'personalizada1_aluno1'), {
      concluida: false, progressoAtual: 0, atualizadoEm: AGORA,
    }));
  });

  test('responsável não escreve progresso de missão automática (presença)', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'presenca1_aluno1'), progressoBase('presenca1')));
  });

  test('responsável não grava os campos de crédito de pontos', async () => {
    await semearCenario();
    await assertFails(setDoc(
      doc(comoUsuario('academia1'), 'missoesProgresso', 'personalizada1_aluno1'),
      progressoBase('personalizada1', { pontosCreditados: 0 }),
    ));
    await semear(async (db) => {
      await setDoc(doc(db, 'missoesProgresso', 'personalizada1_aluno1'), progressoBase('personalizada1', { pontosCreditados: 10 }));
    });
    await assertFails(updateDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'personalizada1_aluno1'), { pontosCreditados: 0 }));
  });

  test('outro responsável não marca missão que não é dele, mesmo com vínculo com o aluno', async () => {
    await semearCenario();
    await assertFails(setDoc(
      doc(comoUsuario('academia2'), 'missoesProgresso', 'personalizada1_aluno1'),
      progressoBase('personalizada1', { responsavelId: 'academia2' }),
    ));
  });

  test('id fora do padrão missaoId_alunoId é negado', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'qualquer'), progressoBase('personalizada1')));
  });

  test('ninguém apaga progresso pelo client', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoesProgresso', 'personalizada1_aluno1'), progressoBase('personalizada1'));
    });
    await assertFails(deleteDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'personalizada1_aluno1')));
  });
});

// RF23: público-alvo e vigência. A leitura do aluno depende de `leitoresIds` (mantido pela Cloud
// Function), a conclusão de missão personalizada só vale dentro da vigência e para o público-alvo.
describe('missoes: público-alvo e vigência (RF23)', () => {
  const UM_DIA = 24 * 60;

  async function semearGestores() {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
      await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
      await setDoc(doc(db, 'usuarios', 'aluno2'), usuarioBase({ perfil: 'aluno' }));
      await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
      await setDoc(doc(db, 'usuarios', 'aluno2', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
      await setDoc(doc(db, 'turmas', 'turmaA1'), turmaBase('academia1', 'academia'));
      await setDoc(doc(db, 'turmas', 'turmaA2'), turmaBase('academia2', 'academia'));
    });
  }

  test('gestor cria missão com público e vigência válidos', async () => {
    await semearGestores();
    const db = comoUsuario('academia1');
    await assertSucceeds(setDoc(doc(db, 'missoes', 'todos'), missaoBase('academia1')));
    await assertSucceeds(setDoc(doc(db, 'missoes', 'turma'), missaoBase('academia1', { publicoAlvo: 'turma', turmaId: 'turmaA1' })));
    await assertSucceeds(setDoc(doc(db, 'missoes', 'alunos'), missaoBase('academia1', { publicoAlvo: 'alunos', alunosAlvoIds: ['aluno1'] })));
  });

  test('criação sem vigência, com fim antes do início ou com mais de um ano é negada', async () => {
    await semearGestores();
    const db = comoUsuario('academia1');
    await assertFails(setDoc(doc(db, 'missoes', 'm1'), missaoAntigaBase('academia1', { publicoAlvo: 'todos' })));
    await assertFails(setDoc(doc(db, 'missoes', 'm2'), missaoBase('academia1', {
      vigenciaInicio: minutosAPartirDeAgora(UM_DIA), vigenciaFim: minutosAPartirDeAgora(-UM_DIA),
    })));
    await assertFails(setDoc(doc(db, 'missoes', 'm3'), missaoBase('academia1', {
      vigenciaInicio: AGORA, vigenciaFim: minutosAPartirDeAgora(400 * UM_DIA),
    })));
  });

  test('público inválido é negado: sem tipo, turma de outro responsável, lista de alunos vazia', async () => {
    await semearGestores();
    const db = comoUsuario('academia1');
    await assertFails(setDoc(doc(db, 'missoes', 'm1'), missaoBase('academia1', { publicoAlvo: 'qualquer' })));
    await assertFails(setDoc(doc(db, 'missoes', 'm2'), missaoBase('academia1', { publicoAlvo: 'turma', turmaId: 'turmaA2' })));
    await assertFails(setDoc(doc(db, 'missoes', 'm3'), missaoBase('academia1', { publicoAlvo: 'turma' })));
    await assertFails(setDoc(doc(db, 'missoes', 'm4'), missaoBase('academia1', { publicoAlvo: 'alunos', alunosAlvoIds: [] })));
  });

  test('client não grava os campos da Cloud Function (leitoresIds, situacao, alunosNotificadosIds)', async () => {
    await semearGestores();
    const db = comoUsuario('academia1');
    await assertFails(setDoc(doc(db, 'missoes', 'm1'), missaoBase('academia1', { leitoresIds: ['aluno1'] })));
    await semear(async (admin) => {
      await setDoc(doc(admin, 'missoes', 'm2'), missaoBase('academia1', { leitoresIds: [] }));
    });
    await assertFails(updateDoc(doc(db, 'missoes', 'm2'), { leitoresIds: ['aluno2'] }));
    await assertFails(updateDoc(doc(db, 'missoes', 'm2'), { situacao: 'vigente' }));
    await assertFails(updateDoc(doc(db, 'missoes', 'm2'), { alunosNotificadosIds: ['aluno2'] }));
    await assertSucceeds(updateDoc(doc(db, 'missoes', 'm2'), { ativa: false }));
  });

  test('missão antiga, sem público e vigência, continua podendo ser ligada e desligada', async () => {
    await semearGestores();
    await semear(async (admin) => {
      await setDoc(doc(admin, 'missoes', 'antiga'), missaoAntigaBase('academia1'));
    });
    await assertSucceeds(updateDoc(doc(comoUsuario('academia1'), 'missoes', 'antiga'), { ativa: false }));
  });

  test('aluno lê só a missão em que está em leitoresIds, inclusive pela consulta do app', async () => {
    await semearGestores();
    await semear(async (admin) => {
      await setDoc(doc(admin, 'missoes', 'dele'), missaoBase('academia1', { leitoresIds: ['aluno1'] }));
      await setDoc(doc(admin, 'missoes', 'deOutro'), missaoBase('academia1', { leitoresIds: ['aluno2'] }));
    });
    const db = comoUsuario('aluno1');
    await assertSucceeds(getDoc(doc(db, 'missoes', 'dele')));
    await assertFails(getDoc(doc(db, 'missoes', 'deOutro')));
    const snap = await assertSucceeds(getDocs(query(collection(db, 'missoes'), where('leitoresIds', 'array-contains', 'aluno1'))));
    expect(snap.docs.map((d) => d.id)).toEqual(['dele']);
    // A consulta antiga (por responsável + ativa) não é mais provável para o aluno
    await assertFails(getDocs(query(collection(db, 'missoes'), where('responsavelId', '==', 'academia1'), where('ativa', '==', true))));
  });

  async function semearPersonalizada(overrides: Record<string, unknown>) {
    await semearGestores();
    await semear(async (admin) => {
      await setDoc(doc(admin, 'missoes', 'pers'), missaoBase('academia1', { tipo: 'personalizada', meta: 1, ...overrides }));
    });
  }

  function marcar(alunoId: string, concluida = true) {
    return setDoc(doc(comoUsuario('academia1'), 'missoesProgresso', `pers_${alunoId}`), {
      id: `pers_${alunoId}`, missaoId: 'pers', alunoId, responsavelId: 'academia1',
      progressoAtual: concluida ? 1 : 0, concluida, atualizadoEm: AGORA,
    });
  }

  test('conclusão fora da vigência é negada (antes do início e depois do fim)', async () => {
    await semearPersonalizada({ vigenciaInicio: minutosAPartirDeAgora(UM_DIA), vigenciaFim: minutosAPartirDeAgora(2 * UM_DIA) });
    await assertFails(marcar('aluno1'));
    await semearPersonalizada({ vigenciaInicio: minutosAPartirDeAgora(-2 * UM_DIA), vigenciaFim: minutosAPartirDeAgora(-UM_DIA) });
    await assertFails(marcar('aluno1'));
  });

  test('depois do fim, desmarcar uma conclusão continua permitido', async () => {
    await semearPersonalizada({ vigenciaInicio: minutosAPartirDeAgora(-2 * UM_DIA), vigenciaFim: minutosAPartirDeAgora(-UM_DIA) });
    await semear(async (admin) => {
      await setDoc(doc(admin, 'missoesProgresso', 'pers_aluno1'), {
        id: 'pers_aluno1', missaoId: 'pers', alunoId: 'aluno1', responsavelId: 'academia1',
        progressoAtual: 1, concluida: true, atualizadoEm: AGORA,
      });
    });
    await assertSucceeds(updateDoc(doc(comoUsuario('academia1'), 'missoesProgresso', 'pers_aluno1'), {
      concluida: false, progressoAtual: 0, atualizadoEm: AGORA,
    }));
  });

  test('conclusão só para aluno do público: alunos escolhidos', async () => {
    await semearPersonalizada({ publicoAlvo: 'alunos', alunosAlvoIds: ['aluno1'] });
    await assertSucceeds(marcar('aluno1'));
    await assertFails(marcar('aluno2'));
  });

  test('conclusão só para aluno do público: turma (matrícula ativa)', async () => {
    await semearPersonalizada({ publicoAlvo: 'turma', turmaId: 'turmaA1' });
    await semear(async (admin) => {
      await setDoc(doc(admin, 'matriculas', 'turmaA1_aluno1'), matriculaBase('turmaA1', 'aluno1', 'academia1'));
      await setDoc(doc(admin, 'matriculas', 'turmaA1_aluno2'), matriculaBase('turmaA1', 'aluno2', 'academia1', { status: 'inativa' }));
    });
    await assertSucceeds(marcar('aluno1'));
    await assertFails(marcar('aluno2'));
  });
});
