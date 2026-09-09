// RF07, RF08, RN05, RN06: vínculos entre aluno, professor e academia
// (RF09, gestão do vínculo pela academia, é Ciclo 3)
import {
  doc, getDoc, setDoc, updateDoc, runTransaction, arrayUnion,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Usuario, Vinculo, VinculosPrivado, TipoVinculo, PerfilSolicitante, PerfilDestinatario } from '../types';
import { agoraTimestamp } from '../utils/datas';

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

// RF08: "autônomo" é uma propriedade do professor (não do vínculo), então a consulta
// não precisa mais ler `vinculos` — evita a leitura ampla que expunha o grafo institucional (RNF04)
export async function listarProfessoresAutonomos(): Promise<Usuario[]> {
  const q = query(
    collection(db, COLECAO_USUARIOS),
    where('perfil', '==', 'professor'),
    where('autonomo', '==', true),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Usuario);
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
    criadoEm: agoraTimestamp(),
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

// RN05, RN06: aceitar um vínculo grava o id do responsável em usuarios/{solicitanteId}/
// privado/vinculos.responsaveisIds — documento fechado a qualquer client (Fase 1 desta
// rodada), lido só via get()/exists() dentro de firestore.rules, que não passam pelas
// regras de leitura. É o que permite a `matriculas.create` checar "tenho vínculo ativo com
// X" sem expor o grafo institucional pela leitura aberta de `usuarios` (RNF04).
// Aceitar um vínculo professor-academia também derruba `autonomo` do professor (esse campo
// continua no documento raiz — não é sensível do mesmo jeito que o grafo de vínculos).
// As escritas (vínculo + privado + usuário) vão na mesma transação para nunca divergir.
// "Encerramento" de vínculo (que removeria o id de `responsaveisIds` e reavaliaria
// `autonomo`) é RF09, Ciclo 3 — não existe hoje nenhum fluxo para encerrar um vínculo aceito.
export async function responderSolicitacao(
  vinculoId: string,
  resposta: 'aceito' | 'recusado',
): Promise<void> {
  const vinculoRef = doc(db, COLECAO_VINCULOS, vinculoId);

  if (resposta === 'recusado') {
    await updateDoc(vinculoRef, { status: 'recusado', respondidoEm: agoraTimestamp() });
    return;
  }

  await runTransaction(db, async (transacao) => {
    const vinculoSnap = await transacao.get(vinculoRef);
    if (!vinculoSnap.exists()) {
      throw new Error('Vínculo não encontrado.');
    }
    const vinculo = vinculoSnap.data() as Vinculo;
    const agora = agoraTimestamp();

    transacao.update(vinculoRef, { status: 'aceito', respondidoEm: agora });

    const privadoRef = doc(db, COLECAO_USUARIOS, vinculo.solicitanteId, 'privado', 'vinculos');
    const dadosPrivados: Partial<VinculosPrivado> = { responsaveisIds: arrayUnion(vinculo.destinatarioId) as unknown as string[] };
    transacao.set(privadoRef, dadosPrivados, { merge: true });

    if (vinculo.tipo === 'professor-academia') {
      transacao.update(doc(db, COLECAO_USUARIOS, vinculo.solicitanteId), {
        autonomo: false,
        atualizadoEm: agora,
      });
    }
  });
}

// RN05, RN06: vínculo bilateral aceito, checado nos dois sentidos pelo ID determinístico —
// mesmo padrão usado por vinculoAtivoEntre() no firestore.rules
export async function existeVinculoAtivoEntre(uidA: string, uidB: string): Promise<boolean> {
  const [snapAB, snapBA] = await Promise.all([
    getDoc(doc(db, COLECAO_VINCULOS, `${uidA}_${uidB}`)),
    getDoc(doc(db, COLECAO_VINCULOS, `${uidB}_${uidA}`)),
  ]);
  return (
    (snapAB.exists() && (snapAB.data() as Vinculo).status === 'aceito') ||
    (snapBA.exists() && (snapBA.data() as Vinculo).status === 'aceito')
  );
}

// RF08: responsáveis (academia ou professor autônomo) com quem o aluno tem vínculo ativo —
// o aluno é sempre o solicitante nos tipos aluno-academia e aluno-professor
export async function listarResponsaveisAtivosDoAluno(alunoId: string): Promise<string[]> {
  const q = query(
    collection(db, COLECAO_VINCULOS),
    where('solicitanteId', '==', alunoId),
    where('status', '==', 'aceito'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => (d.data() as Vinculo).destinatarioId);
}
