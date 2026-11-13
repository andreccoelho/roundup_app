// RF18, RN01: teste de integração de atualizarMissoesNoCheckIn (progresso automático) e
// creditarPontosDaMissao (crédito e estorno dos pontos da missão) — functions/src/missoes.ts.
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, semear,
  usuarioBase, missaoBase, checkinBase, sessaoBase, vinculosPrivadoBase, AGORA,
} from '../rules/helpers';
import { aguardar } from './emuladores';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

jest.setTimeout(30000);

const UM_DIA = 24 * 60 * 60 * 1000;

// Mesmo cálculo de periodoDe() em functions/src/missoes.ts
function periodoAtual(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' })
    .format(new Date()).slice(0, 7);
}

const CLASSIFICACAO = () => `aluno1_academia1_${periodoAtual()}`;

async function ler(caminho: string): Promise<Record<string, any> | undefined> {
  let dados: Record<string, any> | undefined;
  await semear(async (db) => {
    const snap = await getDoc(doc(db, caminho));
    dados = snap.exists() ? snap.data() : undefined;
  });
  return dados;
}

async function semearMissao(id: string, overrides: Record<string, unknown>): Promise<void> {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno1', 'privado', 'vinculos'), vinculosPrivadoBase(['academia1']));
    await setDoc(doc(db, 'missoes', id), missaoBase('academia1', {
      criadoEm: Timestamp.fromMillis(Date.now() - 10 * UM_DIA),
      ...overrides,
    }));
  });
}

async function semearCheckin(sessaoId: string, dataHora: Timestamp = AGORA): Promise<void> {
  await semear(async (db) => {
    await setDoc(doc(db, 'checkins', `${sessaoId}_aluno1`), checkinBase(sessaoId, 'turma1', 'aluno1', 'academia1', { dataHora }));
  });
}

async function validar(sessaoId: string, status: 'validado' | 'pendente' = 'validado'): Promise<void> {
  await semear(async (db) => {
    await updateDoc(doc(db, 'checkins', `${sessaoId}_aluno1`), { status, pontos: status === 'validado' ? 10 : 0 });
  });
}

describe('progresso automático e pontos de missão (RF18)', () => {
  test('presença: cada check-in validado avança, a conclusão credita os pontos e o estorno desfaz', async () => {
    await semearMissao('presenca1', { tipo: 'presenca', meta: 2, pontos: 30 });
    await semearCheckin('s1');
    await semearCheckin('s2');

    await validar('s1');
    await aguardar(async () => (await ler('missoesProgresso/presenca1_aluno1'))?.progressoAtual === 1);
    expect((await ler('missoesProgresso/presenca1_aluno1'))?.concluida).toBe(false);

    await validar('s2');
    await aguardar(async () => (await ler(`classificacoes/${CLASSIFICACAO()}`))?.pontos === 30);
    const progresso = await ler('missoesProgresso/presenca1_aluno1');
    expect(progresso?.concluida).toBe(true);
    expect(progresso?.pontosCreditados).toBe(30);

    await validar('s2', 'pendente');
    await aguardar(async () => (await ler(`classificacoes/${CLASSIFICACAO()}`))?.pontos === 0);
    expect((await ler('missoesProgresso/presenca1_aluno1'))?.concluida).toBe(false);
  });

  test('RF23: check-in anterior ao início da vigência não conta', async () => {
    await semearMissao('presenca1', { tipo: 'presenca', meta: 1, pontos: 30, vigenciaInicio: AGORA });
    await semearCheckin('antigo', Timestamp.fromMillis(Date.now() - 5 * UM_DIA));
    await semearCheckin('novo', Timestamp.fromMillis(Date.now() + 60_000));

    await validar('antigo');
    await new Promise((r) => setTimeout(r, 2000));
    expect(await ler('missoesProgresso/presenca1_aluno1')).toBeUndefined();

    await validar('novo');
    await aguardar(async () => (await ler('missoesProgresso/presenca1_aluno1'))?.concluida === true);
  });

  test('sequência: conta sessões agendadas seguidas; dia sem aula não quebra, falta quebra', async () => {
    await semearMissao('sequencia1', { tipo: 'sequencia', meta: 3, pontos: 50 });
    // Sessões do aluno a cada 3 dias (sem aula nos dias do meio); a mais antiga, s3, ele faltou
    await semear(async (db) => {
      for (let i = 0; i < 4; i += 1) {
        const inicio = Date.now() - (i * 3 + 1) * UM_DIA;
        await setDoc(doc(db, 'sessoes', `s${i}`), sessaoBase('turma1', 'academia1', 'academia1', {
          status: 'encerrada',
          inicio: Timestamp.fromMillis(inicio),
          janelaCheckInInicio: Timestamp.fromMillis(inicio - 30 * 60_000),
          janelaCheckInFim: Timestamp.fromMillis(inicio + 60 * 60_000),
          leitoresIds: ['academia1', 'aluno1'],
        }));
      }
    });
    for (let i = 0; i < 3; i += 1) {
      await semearCheckin(`s${i}`, Timestamp.fromMillis(Date.now() - (i * 3 + 1) * UM_DIA));
    }
    await validar('s2');
    await validar('s1');
    await aguardar(async () => (await ler('missoesProgresso/sequencia1_aluno1'))?.progressoAtual === 2);
    expect((await ler('missoesProgresso/sequencia1_aluno1'))?.concluida).toBe(false);

    await validar('s0');
    await aguardar(async () => (await ler('missoesProgresso/sequencia1_aluno1'))?.concluida === true);
    expect((await ler('missoesProgresso/sequencia1_aluno1'))?.progressoAtual).toBe(3);
    await aguardar(async () => (await ler(`classificacoes/${CLASSIFICACAO()}`))?.pontos === 50);
  });

  test('personalizada: marcar credita, desmarcar estorna, sem crédito em dobro', async () => {
    await semearMissao('pers1', { tipo: 'personalizada', meta: 1, pontos: 40 });
    await semear(async (db) => {
      await setDoc(doc(db, 'classificacoes', CLASSIFICACAO()), {
        id: CLASSIFICACAO(), alunoId: 'aluno1', responsavelId: 'academia1', periodo: periodoAtual(), pontos: 10, atualizadoEm: AGORA,
      });
      await setDoc(doc(db, 'missoesProgresso', 'pers1_aluno1'), {
        id: 'pers1_aluno1', missaoId: 'pers1', alunoId: 'aluno1', responsavelId: 'academia1',
        progressoAtual: 1, concluida: true, dataConclusao: AGORA, atualizadoEm: AGORA,
      });
    });
    await aguardar(async () => (await ler(`classificacoes/${CLASSIFICACAO()}`))?.pontos === 50);

    // reescrever o mesmo estado (gatilho de novo) não credita outra vez
    await semear(async (db) => {
      await updateDoc(doc(db, 'missoesProgresso', 'pers1_aluno1'), { atualizadoEm: Timestamp.now() });
    });
    await new Promise((r) => setTimeout(r, 2000));
    expect((await ler(`classificacoes/${CLASSIFICACAO()}`))?.pontos).toBe(50);

    await semear(async (db) => {
      await updateDoc(doc(db, 'missoesProgresso', 'pers1_aluno1'), { concluida: false, progressoAtual: 0 });
    });
    await aguardar(async () => (await ler(`classificacoes/${CLASSIFICACAO()}`))?.pontos === 10);
  });
});

describe('progresso automático respeita vigência e público-alvo (RF23)', () => {
  test('check-in depois do fim da vigência não conta', async () => {
    await semearMissao('presenca1', {
      tipo: 'presenca', meta: 1, pontos: 30,
      vigenciaInicio: Timestamp.fromMillis(Date.now() - 10 * UM_DIA),
      vigenciaFim: Timestamp.fromMillis(Date.now() - 2 * UM_DIA),
    });
    await semearCheckin('depois', Timestamp.fromMillis(Date.now() - UM_DIA));
    await semearCheckin('dentro', Timestamp.fromMillis(Date.now() - 5 * UM_DIA));

    await validar('depois');
    await new Promise((r) => setTimeout(r, 2000));
    expect(await ler('missoesProgresso/presenca1_aluno1')).toBeUndefined();

    // treino dentro da vigência, validado depois do fim: conta (vale o horário do treino)
    await validar('dentro');
    await aguardar(async () => (await ler('missoesProgresso/presenca1_aluno1'))?.concluida === true);
  });

  test('aluno fora do público-alvo não ganha progresso', async () => {
    await semearMissao('soOutro', { tipo: 'presenca', meta: 1, pontos: 30, publicoAlvo: 'alunos', alunosAlvoIds: ['aluno2'] });
    await semearMissao('turma', { tipo: 'presenca', meta: 1, pontos: 30, publicoAlvo: 'turma', turmaId: 'turma9' });
    await semearMissao('todos', { tipo: 'presenca', meta: 1, pontos: 30 });
    await semearCheckin('s1');

    await validar('s1');
    await aguardar(async () => (await ler('missoesProgresso/todos_aluno1'))?.concluida === true);
    expect(await ler('missoesProgresso/soOutro_aluno1')).toBeUndefined();
    expect(await ler('missoesProgresso/turma_aluno1')).toBeUndefined();
  });
});
