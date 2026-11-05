// RF33: personalização da pontuação e dos níveis pelo responsável (academia ou professor
// autônomo). Um documento por responsável, id == responsavelId; sem documento valem os padrões de
// src/config/gamificacao.ts. "Restaurar padrão" apaga o documento.
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Classificacao, ConfiguracaoGamificacao } from '../types';
import { NIVEIS_XP, PONTOS_POR_MISSAO_PADRAO, XP_POR_CHECKIN_VALIDADO } from '../config/gamificacao';
import type { ValoresGamificacao } from '../utils/gamificacao';

const COLECAO = 'configuracoesGamificacao';

export const VALORES_PADRAO: ValoresGamificacao = {
  pontosPorCheckin: XP_POR_CHECKIN_VALIDADO,
  pontosPorMissao: PONTOS_POR_MISSAO_PADRAO,
  niveisXp: [...NIVEIS_XP],
};

export async function buscarConfiguracao(responsavelId: string): Promise<ConfiguracaoGamificacao | null> {
  const snap = await getDoc(doc(db, COLECAO, responsavelId));
  return snap.exists() ? (snap.data() as ConfiguracaoGamificacao) : null;
}

export function valoresEfetivos(config: ConfiguracaoGamificacao | null): ValoresGamificacao {
  if (!config) return VALORES_PADRAO;
  return { pontosPorCheckin: config.pontosPorCheckin, pontosPorMissao: config.pontosPorMissao, niveisXp: config.niveisXp };
}

export async function salvarConfiguracao(responsavelId: string, valores: ValoresGamificacao): Promise<void> {
  const config: ConfiguracaoGamificacao = { id: responsavelId, responsavelId, ...valores, atualizadoEm: new Date() };
  await setDoc(doc(db, COLECAO, responsavelId), config);
}

export async function restaurarPadrao(responsavelId: string): Promise<void> {
  await deleteDoc(doc(db, COLECAO, responsavelId));
}

// RF17, RF33: um aluno pode ter mais de um vínculo, cada responsável com sua tabela de níveis. O
// nível usa a tabela do responsável em que o aluno mais pontuou (somando todos os meses) — o XP
// exibido continua sendo o total de todos os escopos. Ver docs/DECISOES_PENDENTES.md, item 8.
export async function buscarNiveisDoAluno(classificacoes: Classificacao[]): Promise<number[]> {
  const pontosPorEscopo = new Map<string, number>();
  classificacoes.forEach((c) => pontosPorEscopo.set(c.responsavelId, (pontosPorEscopo.get(c.responsavelId) ?? 0) + c.pontos));
  const principal = [...pontosPorEscopo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!principal) return VALORES_PADRAO.niveisXp;
  return valoresEfetivos(await buscarConfiguracao(principal)).niveisXp;
}
