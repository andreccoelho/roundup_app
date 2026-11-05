// RF31: teste de integração das notificações (functions/src/notificacoes.ts). No emulador nada sai
// para o serviço de push da Expo: cada envio vira um registro em `notificacoes` com status
// 'simulado' (aparelho registrado) ou 'semDispositivo' — é isso que o teste confere.
// O lembrete diário é agendado (Cloud Scheduler), e o emulador não dispara agendamentos: o teste
// chama enviarLembretesDoDia() direto, com o Admin SDK apontado para o emulador de Firestore.
import { collection, doc, getDocs, query, setDoc, updateDoc, where, Timestamp } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, semear, PROJECT_ID,
  usuarioBase, vinculoBase, missaoBase, checkinBase, graduacaoBase, sessaoBase, AGORA,
} from '../rules/helpers';
import { aguardar } from './emuladores';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(limparDados);

jest.setTimeout(30000);

async function notificacoesDe(uid: string): Promise<Record<string, any>[]> {
  let lista: Record<string, any>[] = [];
  await semear(async (db) => {
    const snap = await getDocs(query(collection(db, 'notificacoes'), where('destinatarioId', '==', uid)));
    lista = snap.docs.map((d) => d.data());
  });
  return lista;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

// aluno1: aparelho registrado; aluno2: desligou "nova missão"; aluno3: sem aparelho
async function semearAlunos(): Promise<void> {
  await semear(async (db) => {
    await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
    await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    await setDoc(doc(db, 'usuarios', 'aluno2'), usuarioBase({
      perfil: 'aluno', preferenciasNotificacao: { lembreteSessao: true, novaMissao: false, conquista: true },
    }));
    await setDoc(doc(db, 'usuarios', 'aluno3'), usuarioBase({ perfil: 'aluno' }));
    for (const aluno of ['aluno1', 'aluno2']) {
      await setDoc(doc(db, 'usuarios', aluno, 'privado', 'notificacoes'), { tokens: [`ExponentPushToken[${aluno}]`] });
    }
    for (const aluno of ['aluno1', 'aluno2', 'aluno3']) {
      await setDoc(doc(db, 'vinculos', `${aluno}_academia1`), vinculoBase(aluno, 'academia1', {
        tipo: 'aluno-academia', perfilSolicitante: 'aluno', perfilDestinatario: 'academia', status: 'aceito',
      }));
    }
  });
}

describe('notificações (RF31)', () => {
  test('nova missão: avisa os alunos vinculados, respeitando a preferência', async () => {
    await semearAlunos();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoes', 'missao1'), missaoBase('academia1', { titulo: 'Treinar 3x' }));
    });

    await aguardar(async () => (await notificacoesDe('aluno1')).length === 1 && (await notificacoesDe('aluno3')).length === 1);
    const [paraAluno1] = await notificacoesDe('aluno1');
    expect(paraAluno1).toMatchObject({ tipo: 'novaMissao', status: 'simulado', titulo: 'Nova missão' });
    expect((await notificacoesDe('aluno3'))[0].status).toBe('semDispositivo');
    expect(await notificacoesDe('aluno2')).toEqual([]);
  });

  test('missão desativada e reativada avisa de novo; editar sem reativar não avisa', async () => {
    await semearAlunos();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoes', 'missao1'), missaoBase('academia1', { ativa: false }));
    });
    await esperar(1500);
    expect(await notificacoesDe('aluno1')).toEqual([]);

    await semear(async (db) => {
      await updateDoc(doc(db, 'missoes', 'missao1'), { ativa: true });
    });
    await aguardar(async () => (await notificacoesDe('aluno1')).length === 1);

    await semear(async (db) => {
      await updateDoc(doc(db, 'missoes', 'missao1'), { descricao: 'outra' });
    });
    await esperar(1500);
    expect(await notificacoesDe('aluno1')).toHaveLength(1);
  });

  test('conquista: missão concluída e graduação avisam uma vez só', async () => {
    await semearAlunos();
    await semear(async (db) => {
      await setDoc(doc(db, 'missoes', 'pers1'), missaoBase('academia1', { tipo: 'personalizada', ativa: false, pontos: 0 }));
      await setDoc(doc(db, 'missoesProgresso', 'pers1_aluno1'), {
        missaoId: 'pers1', alunoId: 'aluno1', responsavelId: 'academia1', progressoAtual: 1, concluida: true, atualizadoEm: AGORA,
      });
      await setDoc(doc(db, 'graduacoes', 'grad1'), graduacaoBase('aluno1', 'academia1'));
    });
    await aguardar(async () => (await notificacoesDe('aluno1')).length === 2);

    // desfazer e refazer a conclusão não avisa de novo
    await semear(async (db) => {
      await updateDoc(doc(db, 'missoesProgresso', 'pers1_aluno1'), { concluida: false });
    });
    await semear(async (db) => {
      await updateDoc(doc(db, 'missoesProgresso', 'pers1_aluno1'), { concluida: true });
    });
    await esperar(2000);
    const lista = await notificacoesDe('aluno1');
    expect(lista).toHaveLength(2);
    expect(lista.every((n) => n.tipo === 'conquista')).toBe(true);
  });

  test('conquista: o 10º treino validado avisa a medalha', async () => {
    await semearAlunos();
    await semear(async (db) => {
      for (let i = 0; i < 10; i += 1) {
        await setDoc(doc(db, 'checkins', `s${i}_aluno1`), checkinBase(`s${i}`, 'turma1', 'aluno1', 'academia1', {
          status: i < 9 ? 'validado' : 'pendente',
          dataHora: Timestamp.fromMillis(Date.now() - i * 3 * 24 * 60 * 60 * 1000),
        }));
      }
    });
    await semear(async (db) => {
      await updateDoc(doc(db, 'checkins', 's9_aluno1'), { status: 'validado' });
    });
    await aguardar(async () => (await notificacoesDe('aluno1')).some((n) => n.corpo.includes('10 treinos')));
  });

  test('lembrete de sessão: um por aluno no dia, mesmo rodando duas vezes', async () => {
    process.env.FUNCTIONS_EMULATOR = 'true';
    process.env.GCLOUD_PROJECT = PROJECT_ID;
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { enviarLembretesDoDia } = require('../../functions/src/index');

    await semearAlunos();
    const agora = new Date();
    const daqui = (minutos: number) => Timestamp.fromMillis(agora.getTime() + minutos * 60_000);
    await semear(async (db) => {
      await setDoc(doc(db, 'sessoes', 'manha'), sessaoBase('turma1', 'academia1', 'professor1', {
        status: 'agendada', inicio: daqui(1), leitoresIds: ['academia1', 'professor1', 'aluno1', 'aluno2'],
      }));
      await setDoc(doc(db, 'sessoes', 'tarde'), sessaoBase('turma1', 'academia1', 'professor1', {
        status: 'agendada', inicio: daqui(2), leitoresIds: ['academia1', 'professor1', 'aluno1'],
      }));
      await setDoc(doc(db, 'sessoes', 'cancelada'), sessaoBase('turma1', 'academia1', 'professor1', {
        status: 'cancelada', inicio: daqui(1), leitoresIds: ['academia1', 'aluno3'],
      }));
    });

    await enviarLembretesDoDia(agora);
    await enviarLembretesDoDia(agora);

    const lembretes = async (uid: string) => (await notificacoesDe(uid)).filter((n) => n.tipo === 'lembreteSessao');
    expect(await lembretes('aluno1')).toHaveLength(1);
    expect(await lembretes('aluno2')).toHaveLength(1);
    expect(await lembretes('aluno3')).toHaveLength(0);
    expect(await lembretes('professor1')).toHaveLength(0);
  });
});
