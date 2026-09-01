// RF07, RF08, RF09, RN05, RN06: vínculos entre aluno, professor e academia
import {
  doc, setDoc, updateDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Usuario, Vinculo, TipoVinculo, PerfilSolicitante, PerfilDestinatario } from '../types';

const COLECAO_VINCULOS = 'vinculos';
const COLECAO_USUARIOS = 'usuarios';

export function determinarTipoVinculo(
  perfilSolicitante: PerfilSolicitante,
  perfilDestinatario: PerfilDestinatario,
): TipoVinculo {
  if (perfilSolicitante === 'aluno' && perfilDestinatario === 'academia') return 'aluno-academia';
  if (perfilSolicitante === 'aluno' && perfilDestinatario === 'professor') return 'aluno-professor';
  if (perfilSolicitante === 'professor' && perfilDestinatario === 'academia') return 'professor-academia';
  throw new Error(`Combinação de vínculo inválida: ${perfilSolicitante} -> ${perfilDestinatario}`);
}

export async function listarAcademiasDisponiveis(): Promise<Usuario[]> {
  const q = query(collection(db, COLECAO_USUARIOS), where('perfil', '==', 'academia'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Usuario);
}

export async function listarProfessoresAutonomos(): Promise<Usuario[]> {
  const qProfessores = query(collection(db, COLECAO_USUARIOS), where('perfil', '==', 'professor'));
  const qVinculosAtivos = query(
    collection(db, COLECAO_VINCULOS),
    where('tipo', '==', 'professor-academia'),
    where('status', '==', 'aceito'),
  );

  const [snapProfessores, snapVinculos] = await Promise.all([getDocs(qProfessores), getDocs(qVinculosAtivos)]);

  const professoresComAcademia = new Set(
    snapVinculos.docs.map(d => (d.data() as Vinculo).solicitanteId),
  );

  return snapProfessores.docs
    .map(d => d.data() as Usuario)
    .filter(professor => !professoresComAcademia.has(professor.id));
}

export async function solicitarVinculo(
  solicitanteId: string,
  destinatarioId: string,
  perfilSolicitante: PerfilSolicitante,
  perfilDestinatario: PerfilDestinatario,
): Promise<void> {
  const tipo = determinarTipoVinculo(perfilSolicitante, perfilDestinatario);
  const vinculo: Vinculo = {
    id: `${solicitanteId}_${destinatarioId}`,
    solicitanteId,
    destinatarioId,
    perfilSolicitante,
    perfilDestinatario,
    tipo,
    status: 'pendente',
    criadoEm: new Date(),
  };
  await setDoc(doc(db, COLECAO_VINCULOS, vinculo.id), vinculo);
}

export async function listarSolicitacoesPendentes(destinatarioId: string): Promise<Vinculo[]> {
  const q = query(
    collection(db, COLECAO_VINCULOS),
    where('destinatarioId', '==', destinatarioId),
    where('status', '==', 'pendente'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Vinculo);
}

export async function responderSolicitacao(
  vinculoId: string,
  resposta: 'aceito' | 'recusado',
): Promise<void> {
  await updateDoc(doc(db, COLECAO_VINCULOS, vinculoId), {
    status: resposta,
    respondidoEm: new Date(),
  });
}
