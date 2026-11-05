// RF29: teste de integração da callable excluirConta (functions/src/exclusaoConta.ts). Precisa
// dos emuladores de Functions, Firestore, Auth e Storage juntos (`npm run test:functions`): as
// contas são criadas de verdade no emulador de Auth, porque a função só aceita apagar o uid do
// token de quem chama.
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  iniciarAmbiente, encerrarAmbiente, limparDados, semear,
  usuarioBase, vinculoBase, vinculosPrivadoBase, turmaBase, matriculaBase, sessaoBase,
  checkinBase, classificacaoBase, missaoBase, graduacaoBase, minutosAPartirDeAgora, AGORA,
} from '../rules/helpers';
import {
  criarConta, contaExiste, limparContas, enviarArquivo, arquivoExiste, chamarFuncao, ContaTeste,
} from './emuladores';

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
afterEach(async () => {
  await limparDados();
  await limparContas();
});

jest.setTimeout(30000);

async function ler(caminho: string): Promise<Record<string, any> | undefined> {
  let dados: Record<string, any> | undefined;
  await semear(async (db) => {
    const snap = await getDoc(doc(db, caminho));
    dados = snap.exists() ? snap.data() : undefined;
  });
  return dados;
}

// Grava o conjunto de dados que um aluno acumula: vínculo aceito, matrícula, check-in,
// pontos, progresso de missão, graduação e consentimento
async function semearAluno(db: any, alunoId: string, responsavelId: string): Promise<void> {
  await setDoc(doc(db, 'usuarios', alunoId), usuarioBase({ perfil: 'aluno' }));
  await setDoc(doc(db, 'usuarios', alunoId, 'privado', 'vinculos'), vinculosPrivadoBase([responsavelId]));
  await setDoc(doc(db, 'vinculos', `${alunoId}_${responsavelId}`), vinculoBase(alunoId, responsavelId, {
    tipo: 'aluno-academia', status: 'aceito', respondidoEm: AGORA,
  }));
  await setDoc(doc(db, 'matriculas', `turma1_${alunoId}`), matriculaBase('turma1', alunoId, responsavelId));
  await setDoc(doc(db, 'checkins', `sessao1_${alunoId}`), checkinBase('sessao1', 'turma1', alunoId, responsavelId, {
    status: 'validado', pontos: 10,
  }));
  await setDoc(doc(db, 'classificacoes', `${alunoId}_${responsavelId}`), classificacaoBase(alunoId, responsavelId, { pontos: 10 }));
  await setDoc(doc(db, 'missoesProgresso', `missao1_${alunoId}`), {
    missaoId: 'missao1', alunoId, responsavelId, progressoAtual: 1, concluida: false, atualizadoEm: AGORA,
  });
  await setDoc(doc(db, 'graduacoes', `grad_${alunoId}`), graduacaoBase(alunoId, responsavelId));
  await setDoc(doc(db, 'consentimentosLGPD', `lgpd_${alunoId}`), {
    usuarioId: alunoId, versao: '1.0', aceito: true, dataHora: AGORA,
  });
  await setDoc(doc(db, 'usuarios', alunoId, 'privado', 'notificacoes'), { tokens: [`ExponentPushToken[${alunoId}]`] });
  await setDoc(doc(db, 'notificacoes', `n_${alunoId}`), { destinatarioId: alunoId, tipo: 'conquista', status: 'simulado' });
}

const DOCS_DO_ALUNO = (alunoId: string) => [
  `usuarios/${alunoId}`,
  `usuarios/${alunoId}/privado/vinculos`,
  `vinculos/${alunoId}_academia1`,
  `matriculas/turma1_${alunoId}`,
  `checkins/sessao1_${alunoId}`,
  `classificacoes/${alunoId}_academia1`,
  `missoesProgresso/missao1_${alunoId}`,
  `graduacoes/grad_${alunoId}`,
  `consentimentosLGPD/lgpd_${alunoId}`,
  `usuarios/${alunoId}/privado/notificacoes`,
  `notificacoes/n_${alunoId}`,
];

describe('excluirConta (RF29)', () => {
  test('aluno: apaga todos os dados, a foto e a conta, sem tocar nos dados de outro aluno', async () => {
    const aluno: ContaTeste = await criarConta('aluno@example.com');
    const outro: ContaTeste = await criarConta('outro@example.com');

    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'academia1'), usuarioBase({ perfil: 'academia' }));
      await setDoc(doc(db, 'turmas', 'turma1'), turmaBase('academia1', 'academia'));
      await setDoc(doc(db, 'sessoes', 'sessao1'), sessaoBase('turma1', 'academia1', 'academia1', {
        leitoresIds: ['academia1', aluno.uid, outro.uid],
      }));
      await semearAluno(db, aluno.uid, 'academia1');
      await semearAluno(db, outro.uid, 'academia1');
    });
    await enviarArquivo(aluno, `usuarios/${aluno.uid}/foto.jpg`);
    await enviarArquivo(outro, `usuarios/${outro.uid}/foto.jpg`);

    const resposta = await chamarFuncao('excluirConta', {}, aluno.idToken);
    expect(resposta.ok).toBe(true);

    for (const caminho of DOCS_DO_ALUNO(aluno.uid)) {
      expect({ caminho, dados: await ler(caminho) }).toEqual({ caminho, dados: undefined });
    }
    for (const caminho of DOCS_DO_ALUNO(outro.uid)) {
      expect({ caminho, existe: (await ler(caminho)) !== undefined }).toEqual({ caminho, existe: true });
    }

    const sessao = await ler('sessoes/sessao1');
    expect(sessao?.leitoresIds).toEqual(['academia1', outro.uid]);

    expect(await contaExiste(aluno.idToken)).toBe(false);
    expect(await contaExiste(outro.idToken)).toBe(true);
    expect(await arquivoExiste(outro, `usuarios/${aluno.uid}/foto.jpg`)).toBe(false);
    expect(await arquivoExiste(outro, `usuarios/${outro.uid}/foto.jpg`)).toBe(true);
  });

  test('academia: turma com alunos vira inativa, turma vazia é apagada, dados dos alunos ficam', async () => {
    const academia = await criarConta('academia@example.com');
    const A = academia.uid;

    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', A), usuarioBase({ perfil: 'academia' }));
      await setDoc(doc(db, 'usuarios', 'aluno2'), usuarioBase({ perfil: 'aluno' }));
      await setDoc(doc(db, 'usuarios', 'aluno2', 'privado', 'vinculos'), vinculosPrivadoBase([A, 'academia9']));
      await setDoc(doc(db, 'vinculos', `aluno2_${A}`), vinculoBase('aluno2', A, { tipo: 'aluno-academia', status: 'aceito' }));
      await setDoc(doc(db, 'usuarios', 'professor1'), usuarioBase({ perfil: 'professor', autonomo: false }));
      await setDoc(doc(db, 'usuarios', 'professor1', 'privado', 'vinculos'), vinculosPrivadoBase([A]));
      await setDoc(doc(db, 'vinculos', `professor1_${A}`), vinculoBase('professor1', A, { tipo: 'professor-academia', status: 'aceito' }));

      // turma com aluno: preservada como inativa
      await setDoc(doc(db, 'turmas', 'turmaCheia'), turmaBase(A, 'academia', { professorId: 'professor1' }));
      await setDoc(doc(db, 'matriculas', 'turmaCheia_aluno2'), matriculaBase('turmaCheia', 'aluno2', A));
      await setDoc(doc(db, 'sessoes', 'passada'), sessaoBase('turmaCheia', A, 'professor1', {
        status: 'encerrada', inicio: minutosAPartirDeAgora(-60 * 24), leitoresIds: [A, 'professor1', 'aluno2'],
      }));
      await setDoc(doc(db, 'sessoes', 'futura'), sessaoBase('turmaCheia', A, 'professor1', {
        status: 'agendada', inicio: minutosAPartirDeAgora(60 * 24), leitoresIds: [A, 'professor1', 'aluno2'],
      }));
      await setDoc(doc(db, 'checkins', 'passada_aluno2'), checkinBase('passada', 'turmaCheia', 'aluno2', A, { status: 'validado', pontos: 10 }));
      await setDoc(doc(db, 'classificacoes', `aluno2_${A}`), classificacaoBase('aluno2', A, { pontos: 10 }));
      await setDoc(doc(db, 'missoes', 'missaoA'), missaoBase(A));
      await setDoc(doc(db, 'configuracoesGamificacao', A), {
        id: A, responsavelId: A, pontosPorCheckin: 15, pontosPorMissao: 30, niveisXp: [100], atualizadoEm: AGORA,
      });

      // turma sem aluno: apagada com a sessão
      await setDoc(doc(db, 'turmas', 'turmaVazia'), turmaBase(A, 'academia'));
      await setDoc(doc(db, 'sessoes', 'sessaoVazia'), sessaoBase('turmaVazia', A, A, { leitoresIds: [A] }));
    });

    const resposta = await chamarFuncao('excluirConta', {}, academia.idToken);
    expect(resposta.ok).toBe(true);

    expect(await ler(`usuarios/${A}`)).toBeUndefined();
    expect(await ler(`vinculos/aluno2_${A}`)).toBeUndefined();
    expect(await ler(`vinculos/professor1_${A}`)).toBeUndefined();
    expect(await ler('turmas/turmaVazia')).toBeUndefined();
    expect(await ler('sessoes/sessaoVazia')).toBeUndefined();
    expect(await ler(`configuracoesGamificacao/${A}`)).toBeUndefined();

    expect((await ler('turmas/turmaCheia'))?.ativa).toBe(false);
    expect((await ler('sessoes/futura'))?.status).toBe('cancelada');
    expect((await ler('sessoes/passada'))?.status).toBe('encerrada');
    expect((await ler('sessoes/passada'))?.leitoresIds).toEqual(['professor1', 'aluno2']);
    expect((await ler('matriculas/turmaCheia_aluno2'))?.status).toBe('inativa');
    expect((await ler('missoes/missaoA'))?.ativa).toBe(false);

    // dados dos alunos e do professor ficam, sem o id da academia
    expect((await ler('checkins/passada_aluno2'))?.pontos).toBe(10);
    expect((await ler(`classificacoes/aluno2_${A}`))?.pontos).toBe(10);
    expect((await ler('usuarios/aluno2/privado/vinculos'))?.responsaveisIds).toEqual(['academia9']);
    expect((await ler('usuarios/professor1/privado/vinculos'))?.responsaveisIds).toEqual([]);
    expect((await ler('usuarios/professor1'))?.autonomo).toBe(true);

    expect(await contaExiste(academia.idToken)).toBe(false);
  });

  test('chamada sem autenticação é recusada e não apaga nada', async () => {
    await semear(async (db) => {
      await setDoc(doc(db, 'usuarios', 'aluno1'), usuarioBase({ perfil: 'aluno' }));
    });
    const resposta = await chamarFuncao('excluirConta', {});
    expect(resposta.ok).toBe(false);
    expect(resposta.erro?.status).toBe('UNAUTHENTICATED');
    expect(await ler('usuarios/aluno1')).toBeDefined();
  });
});
