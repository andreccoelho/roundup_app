// RN01, RF33: a classificação só muda junto com a validação (ou o estorno) de um check-in, na
// mesma transação e pelo mesmo delta; o crédito de um check-in é o configurado pelo responsável
// (ou 10 por padrão). Cobre o furo antigo em que a regra só conferia QUEM escrevia.
// RN04: um documento por aluno/responsável/mês (`${alunoId}_${responsavelId}_${periodo}`).
// RN09, RNF11: leitura restrita a aluno, responsável e `leitoresIds` (mantido por Cloud Function).
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, comoUsuario, semear,
  usuarioBase, vinculosPrivadoBase, classificacaoBase, checkinBase, missaoBase, AGORA,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

const PERIODO = '2026-11';
const ID = `aluno1_academia1_${PERIODO}`;
const CHECKIN = 'sessao1_aluno1';

async function semearCenario(checkin: Record<string, unknown> = {}) {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'academia2'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
    await setDoc(doc(db, 'checkins', CHECKIN), checkinBase('sessao1', 'turma1', 'aluno1', 'academia1', checkin));
  });
}

async function semearClassificacao(id: string, dados: Record<string, unknown>) {
  await semear(async (db) => {
    await setDoc(doc(db, 'classificacoes', id), dados);
  });
}

// O que validarCheckIn() grava: check-in e classificação no mesmo lote
function validacao(
  uid: string,
  { pontosCheckin, status = 'validado', classificacao, classificacaoId = ID }: {
    pontosCheckin?: number; status?: string; classificacao?: Record<string, unknown>; classificacaoId?: string;
  },
) {
  const db = comoUsuario(uid);
  const lote = writeBatch(db);
  if (pontosCheckin !== undefined) {
    lote.update(doc(db, 'checkins', CHECKIN), { status, pontos: pontosCheckin, classificacaoId, validadoPor: uid, validadoEm: AGORA });
  }
  if (classificacao) {
    lote.set(doc(db, 'classificacoes', classificacaoId), { origemCheckinId: CHECKIN, atualizadoEm: AGORA, ...classificacao }, { merge: true });
  }
  return lote.commit();
}

const NOVA = (pontos: number) => classificacaoBase('aluno1', 'academia1', { id: ID, periodo: PERIODO, pontos });

describe('classificacoes e checkins — crédito acompanhado (RN01)', () => {
  test('validar credita 10 no check-in e cria a classificação do mês', async () => {
    await semearCenario();
    await assertSucceeds(validacao('academia1', { pontosCheckin: 10, classificacao: NOVA(10) }));
  });

  test('classificação sem o check-in mudar junto é negada', async () => {
    await semearCenario();
    await assertFails(validacao('academia1', { classificacao: NOVA(10) }));
  });

  test('check-in ganhando pontos sem a classificação acompanhar é negado', async () => {
    await semearCenario();
    await assertFails(validacao('academia1', { pontosCheckin: 10 }));
  });

  test('classificação com delta diferente do check-in é negada', async () => {
    await semearCenario();
    await assertFails(validacao('academia1', { pontosCheckin: 10, classificacao: NOVA(1000) }));
  });

  test('segundo crédito no mesmo mês soma ao documento existente', async () => {
    await semearCenario();
    await semearClassificacao(ID, NOVA(30));
    await assertSucceeds(validacao('academia1', { pontosCheckin: 10, classificacao: { pontos: 40 } }));
  });

  test('estorno: check-in volta a 0 e a classificação perde o mesmo valor', async () => {
    await semearCenario({ status: 'validado', pontos: 10, classificacaoId: ID });
    await semearClassificacao(ID, NOVA(30));
    await assertSucceeds(validacao('academia1', { pontosCheckin: 0, status: 'pendente', classificacao: { pontos: 20 } }));
  });

  test('zerar o check-in sem estornar a classificação é negado (crédito em dobro)', async () => {
    await semearCenario({ status: 'validado', pontos: 10, classificacaoId: ID });
    await semearClassificacao(ID, NOVA(30));
    await assertFails(validacao('academia1', { pontosCheckin: 0, status: 'pendente' }));
  });

  test('update com delta arbitrário é negado', async () => {
    await semearCenario({ status: 'validado', pontos: 10, classificacaoId: ID });
    await semearClassificacao(ID, NOVA(10));
    await assertFails(updateDoc(doc(comoUsuario('academia1'), 'classificacoes', ID), { pontos: 999999, origemCheckinId: CHECKIN }));
  });

  test('quem não é o responsável do escopo não valida nem credita', async () => {
    await semearCenario();
    await assertFails(validacao('academia2', { pontosCheckin: 10, classificacao: NOVA(10) }));
  });

  test('create para aluno sem vínculo aceito é negado (souResponsavelDoAluno)', async () => {
    await semearCenario();
    await semear(async (db) => {
      await deleteDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'));
    });
    await assertFails(validacao('academia1', { pontosCheckin: 10, classificacao: NOVA(10) }));
  });
});

describe('pontos por check-in configurados pelo responsável (RF33)', () => {
  async function configurar(pontosPorCheckin: number) {
    await semear(async (db) => {
      await setDoc(doc(db, 'configuracoesGamificacao', 'academia1'), {
        id: 'academia1', responsavelId: 'academia1', pontosPorCheckin, pontosPorMissao: 30, niveisXp: [100], atualizadoEm: AGORA,
      });
    });
  }

  test('com a configuração em 15, validar credita 15', async () => {
    await semearCenario();
    await configurar(15);
    await assertSucceeds(validacao('academia1', { pontosCheckin: 15, classificacao: NOVA(15) }));
  });

  test('com a configuração em 15, creditar o padrão 10 é negado', async () => {
    await semearCenario();
    await configurar(15);
    await assertFails(validacao('academia1', { pontosCheckin: 10, classificacao: NOVA(10) }));
  });

  test('sem configuração, creditar outro valor que não 10 é negado', async () => {
    await semearCenario();
    await assertFails(validacao('academia1', { pontosCheckin: 15, classificacao: NOVA(15) }));
  });

  test('estorno devolve o que o check-in recebeu, mesmo depois de a configuração mudar', async () => {
    await semearCenario({ status: 'validado', pontos: 10, classificacaoId: ID });
    await semearClassificacao(ID, NOVA(10));
    await configurar(25);
    await assertSucceeds(validacao('academia1', { pontosCheckin: 0, status: 'pendente', classificacao: { pontos: 0 } }));
  });
});

describe('classificacoes — período (RN04)', () => {
  test('create sem período é negado', async () => {
    await semearCenario();
    const semPeriodo = classificacaoBase('aluno1', 'academia1', { pontos: 10 });
    await assertFails(validacao('academia1', { pontosCheckin: 10, classificacaoId: 'aluno1_academia1', classificacao: semPeriodo }));
  });

  test('create com id que não bate com o período gravado é negado', async () => {
    await semearCenario();
    await assertFails(validacao('academia1', { pontosCheckin: 10, classificacaoId: 'aluno1_academia1_2026-10', classificacao: NOVA(10) }));
  });

  test('create com período em formato inválido é negado', async () => {
    await semearCenario();
    const invalido = classificacaoBase('aluno1', 'academia1', { periodo: '2026-13', pontos: 10 });
    await assertFails(validacao('academia1', { pontosCheckin: 10, classificacaoId: 'aluno1_academia1_2026-13', classificacao: invalido }));
  });
});

describe('classificacoes — leitores (RN09, RNF11)', () => {
  test('o gestor não grava leitoresIds na criação', async () => {
    await semearCenario();
    await assertFails(validacao('academia1', {
      pontosCheckin: 10,
      classificacao: classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10, leitoresIds: ['academia1', 'intruso'] }),
    }));
  });

  test('o gestor não altera leitoresIds depois', async () => {
    await semearCenario();
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10, leitoresIds: ['academia1'] }));
    await assertFails(updateDoc(doc(comoUsuario('academia1'), 'classificacoes', ID), { leitoresIds: ['academia1', 'intruso'] }));
  });

  test('aluno do escopo lista o ranking filtrando por leitoresIds', async () => {
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', {
      periodo: PERIODO, pontos: 10, leitoresIds: ['academia1', 'aluno1', 'aluno2'],
    }));
    const db = comoUsuario('aluno2');
    const snap = await assertSucceeds(getDocs(query(
      collection(db, 'classificacoes'),
      where('responsavelId', '==', 'academia1'),
      where('periodo', '==', PERIODO),
      where('leitoresIds', 'array-contains', 'aluno2'),
    )));
    expect(snap.size).toBe(1);
  });

  test('RN09: consulta do ranking só por responsavelId (sem leitoresIds) é negada', async () => {
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', {
      periodo: PERIODO, pontos: 10, leitoresIds: ['academia1', 'aluno1'],
    }));
    await assertFails(getDocs(query(collection(comoUsuario('aluno9'), 'classificacoes'), where('responsavelId', '==', 'academia1'))));
  });

  test('RN09: aluno fora de leitoresIds não lê o documento direto', async () => {
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', {
      periodo: PERIODO, pontos: 10, leitoresIds: ['academia1', 'aluno1'],
    }));
    await assertFails(getDoc(doc(comoUsuario('aluno9'), 'classificacoes', ID)));
  });

  test('RNF11: aluno que não participa continua lendo a própria pontuação', async () => {
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', {
      periodo: PERIODO, pontos: 10, leitoresIds: ['academia1', 'aluno1'],
    }));
    await assertSucceeds(getDocs(query(collection(comoUsuario('aluno1'), 'classificacoes'), where('alunoId', '==', 'aluno1'))));
  });

  test('o responsável lê as classificações do próprio escopo', async () => {
    await semearClassificacao(ID, classificacaoBase('aluno1', 'academia1', { periodo: PERIODO, pontos: 10 }));
    await assertSucceeds(getDocs(query(collection(comoUsuario('academia1'), 'classificacoes'), where('responsavelId', '==', 'academia1'))));
  });
});

describe('configuracoesGamificacao (RF33)', () => {
  const CONFIG = { id: 'academia1', responsavelId: 'academia1', pontosPorCheckin: 15, pontosPorMissao: 40, niveisXp: [100, 300], atualizadoEm: AGORA };

  test('o responsável grava a própria configuração', async () => {
    await semearCenario();
    await assertSucceeds(setDoc(doc(comoUsuario('academia1'), 'configuracoesGamificacao', 'academia1'), CONFIG));
  });

  test('ninguém grava a configuração de outro responsável', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('academia2'), 'configuracoesGamificacao', 'academia1'), CONFIG));
  });

  test('aluno não grava configuração, nem a própria', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('aluno1'), 'configuracoesGamificacao', 'aluno1'), { ...CONFIG, id: 'aluno1', responsavelId: 'aluno1' }));
  });

  test('valores fora dos limites são negados', async () => {
    await semearCenario();
    const db = comoUsuario('academia1');
    await assertFails(setDoc(doc(db, 'configuracoesGamificacao', 'academia1'), { ...CONFIG, pontosPorCheckin: 1000 }));
    await assertFails(setDoc(doc(db, 'configuracoesGamificacao', 'academia1'), { ...CONFIG, pontosPorCheckin: 0 }));
    await assertFails(setDoc(doc(db, 'configuracoesGamificacao', 'academia1'), { ...CONFIG, pontosPorMissao: 5000 }));
    await assertFails(setDoc(doc(db, 'configuracoesGamificacao', 'academia1'), { ...CONFIG, niveisXp: [] }));
    await assertFails(setDoc(doc(db, 'configuracoesGamificacao', 'academia1'), { ...CONFIG, extra: true }));
  });

  test('aluno lê a configuração (precisa da tabela de níveis)', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'configuracoesGamificacao', 'academia1'), CONFIG);
    });
    await assertSucceeds(getDoc(doc(comoUsuario('aluno1'), 'configuracoesGamificacao', 'academia1')));
  });

  test('o responsável restaura o padrão apagando a configuração', async () => {
    await semearCenario();
    await semear(async (db) => {
      await setDoc(doc(db, 'configuracoesGamificacao', 'academia1'), CONFIG);
    });
    await assertSucceeds(deleteDoc(doc(comoUsuario('academia1'), 'configuracoesGamificacao', 'academia1')));
  });
});

describe('missoes — limite de pontos (RF33)', () => {
  test('missão com pontos acima de 1000 é negada', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('academia1'), 'missoes', 'm1'), missaoBase('academia1', { pontos: 5000 })));
  });

  test('missão com pontos fracionados é negada', async () => {
    await semearCenario();
    await assertFails(setDoc(doc(comoUsuario('academia1'), 'missoes', 'm1'), missaoBase('academia1', { pontos: 10.5 })));
  });

  test('missão dentro do limite é aceita', async () => {
    await semearCenario();
    await assertSucceeds(setDoc(doc(comoUsuario('academia1'), 'missoes', 'm1'), missaoBase('academia1', { pontos: 1000 })));
  });
});
