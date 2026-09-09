import * as fs from 'fs';
import * as path from 'path';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { Timestamp } from 'firebase/firestore';

export const PROJECT_ID = 'demo-roundup-app';

let testEnv: RulesTestEnvironment;

export async function iniciarAmbiente(): Promise<void> {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
}

export async function limparDados(): Promise<void> {
  await testEnv.clearFirestore();
}

export async function encerrarAmbiente(): Promise<void> {
  await testEnv.cleanup();
}

// Fábrica de contexto autenticado por perfil — todas as suítes usam só isto para simular usuários
export function comoUsuario(uid: string) {
  return testEnv.authenticatedContext(uid).firestore();
}

export function semAutenticar() {
  return testEnv.unauthenticatedContext().firestore();
}

// Seed comum: grava direto no Firestore ignorando as regras, para o teste não depender
// das próprias regras sob teste para preparar o cenário
export async function semear(fn: (db: FirebaseFirestoreAdmin) => Promise<void>): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    await fn(contexto.firestore());
  });
}

// Tipagem frouxa proposital: o mesmo objeto serve tanto para o client SDK modular
// (doc/setDoc/...) quanto para o contexto de seed do rules-unit-testing
export type FirebaseFirestoreAdmin = any;

export const AGORA = Timestamp.now();

export function minutosAPartirDeAgora(minutos: number): Timestamp {
  return Timestamp.fromMillis(Date.now() + minutos * 60_000);
}

export function usuarioBase(overrides: Record<string, unknown> = {}) {
  return {
    nome: 'Usuário de teste',
    email: 'teste@example.com',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
    ...overrides,
  };
}

export function vinculoBase(
  solicitanteId: string,
  destinatarioId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    solicitanteId,
    destinatarioId,
    status: 'pendente',
    criadoEm: AGORA,
    ...overrides,
  };
}

export function turmaBase(responsavelId: string, responsavelPerfil: 'academia' | 'professor', overrides: Record<string, unknown> = {}) {
  return {
    nome: 'Turma de teste',
    modalidade: 'Jiu-jitsu',
    nivel: 'iniciante',
    responsavelId,
    responsavelPerfil,
    ativa: true,
    criadoEm: AGORA,
    atualizadoEm: AGORA,
    ...overrides,
  };
}

export function matriculaBase(turmaId: string, alunoId: string, responsavelId: string, overrides: Record<string, unknown> = {}) {
  return {
    turmaId,
    alunoId,
    responsavelId,
    status: 'ativa',
    criadoEm: AGORA,
    atualizadoEm: AGORA,
    ...overrides,
  };
}

export function checkinBase(
  sessaoId: string,
  turmaId: string,
  alunoId: string,
  responsavelId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    sessaoId,
    turmaId,
    alunoId,
    responsavelId,
    dataHora: AGORA,
    status: 'pendente',
    pontos: 0,
    ...overrides,
  };
}

export function sessaoBase(
  turmaId: string,
  responsavelId: string,
  professorId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    turmaId,
    responsavelId,
    professorId,
    inicio: minutosAPartirDeAgora(-10),
    fim: minutosAPartirDeAgora(50),
    janelaCheckInInicio: minutosAPartirDeAgora(-40),
    janelaCheckInFim: minutosAPartirDeAgora(50),
    status: 'aberta',
    leitoresIds: [responsavelId, professorId],
    criadoEm: AGORA,
    atualizadoEm: AGORA,
    ...overrides,
  };
}

// RN05, RN06: documento privado usuarios/{uid}/privado/vinculos — grava direto no seed
// (fora das regras) o que responderSolicitacao() gravaria ao aceitar um vínculo
export function vinculosPrivadoBase(responsaveisIds: string[]) {
  return { responsaveisIds };
}
