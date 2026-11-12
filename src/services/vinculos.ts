// RF07, RF08, RN05, RN06: vínculos entre aluno, professor e academia
// (RF09, gestão do vínculo pela academia, é Ciclo 3)
import {
  doc, setDoc, updateDoc, runTransaction, arrayUnion, arrayRemove, deleteField,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Usuario, Vinculo, VinculosPrivado, TipoVinculo, PerfilSolicitante, PerfilDestinatario } from '../types';
import { agoraTimestamp } from '../utils/datas';
import { getDocSeguro } from './firestoreSeguro';

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
  const ref = doc(db, COLECAO_VINCULOS, vinculo.id);

  // O ID é determinístico, então um pedido antigo (recusado ou encerrado) ocupa o mesmo
  // documento: pedir de novo é reabrir esse documento como 'pendente' (firestore.rules permite
  // só essa transição ao solicitante). Sem isso, quem saiu de uma academia nunca conseguiria voltar.
  const existente = await getDocSeguro<Vinculo>(ref);
  if (existente) {
    if (existente.status === 'pendente') throw new Error('Você já enviou um pedido para este destino. Aguarde a resposta.');
    if (existente.status === 'aceito') throw new Error('Você já tem vínculo ativo com este destino.');
    await updateDoc(ref, { status: 'pendente', criadoEm: vinculo.criadoEm, respondidoEm: deleteField() });
    return;
  }
  await setDoc(ref, vinculo);
}

// RF07, RF08: todos os vínculos que o usuário pediu (aluno ou professor são sempre os
// solicitantes), em qualquer estado — base da tela "Meus vínculos". A regra de leitura de
// `vinculos` já permite (solicitanteId == meuId()).
export async function listarVinculosDoSolicitante(solicitanteId: string): Promise<Vinculo[]> {
  const q = query(collection(db, COLECAO_VINCULOS), where('solicitanteId', '==', solicitanteId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Vinculo);
}

// RF07, RF09: `perfilSolicitante` é opcional — o professor só recebe solicitação de aluno
// (sem ambiguidade, chama sem filtro), mas a academia recebe tanto de aluno quanto de professor
// e precisava desse filtro para não misturar os dois em "Gestão de professores"
// (SolicitacoesScreen antes não distinguia, RF09).
export async function listarSolicitacoesPendentes(
  destinatarioId: string,
  perfilSolicitante?: PerfilSolicitante,
): Promise<Vinculo[]> {
  const filtros = [
    where('destinatarioId', '==', destinatarioId),
    where('status', '==', 'pendente'),
  ];
  if (perfilSolicitante) filtros.push(where('perfilSolicitante', '==', perfilSolicitante));
  const q = query(collection(db, COLECAO_VINCULOS), ...filtros);
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

// RF08, RF09: inverso de responderSolicitacao() (ramo aceito) — qualquer das duas pontas encerra
// (o destinatário gerindo, RF09; o solicitante saindo, RF08), e só a partir de 'aceito'
// (firestore.rules trava as duas coisas). Check-ins e graduações já existentes ficam como
// histórico, mas as MATRÍCULAS ativas do aluno com este responsável são canceladas — senão quem
// saiu da academia continuaria na turma e nas sessões dela. Encerrar um vínculo
// professor-academia devolve `autonomo: true` ao professor.
export async function encerrarVinculo(vinculoId: string): Promise<void> {
  const vinculoRef = doc(db, COLECAO_VINCULOS, vinculoId);

  const vinculoEncerrado = await runTransaction(db, async (transacao) => {
    const vinculoSnap = await transacao.get(vinculoRef);
    if (!vinculoSnap.exists()) {
      throw new Error('Vínculo não encontrado.');
    }
    const vinculo = vinculoSnap.data() as Vinculo;
    if (vinculo.status !== 'aceito') {
      throw new Error('Este vínculo não está mais ativo.');
    }
    const agora = agoraTimestamp();

    transacao.update(vinculoRef, { status: 'encerrado', respondidoEm: agora });

    const privadoRef = doc(db, COLECAO_USUARIOS, vinculo.solicitanteId, 'privado', 'vinculos');
    const dadosPrivados: Partial<VinculosPrivado> = { responsaveisIds: arrayRemove(vinculo.destinatarioId) as unknown as string[] };
    transacao.set(privadoRef, dadosPrivados, { merge: true });

    if (vinculo.tipo === 'professor-academia') {
      transacao.update(doc(db, COLECAO_USUARIOS, vinculo.solicitanteId), {
        autonomo: true,
        atualizadoEm: agora,
      });
    }
    return vinculo;
  });

  if (vinculoEncerrado.perfilSolicitante === 'aluno') {
    await cancelarMatriculasDoAlunoCom(vinculoEncerrado.solicitanteId, vinculoEncerrado.destinatarioId);
  }
}

// Fora da transação (o client SDK não faz consulta dentro dela) e sem importar matriculas.ts
// (que já importa este arquivo). A Cloud Function sincronizarLeitorNaAtualizacaoDeMatricula tira
// o aluno das sessões futuras de cada turma quando o status vira 'inativa' (RF14).
async function cancelarMatriculasDoAlunoCom(alunoId: string, responsavelId: string): Promise<void> {
  const q = query(
    collection(db, 'matriculas'),
    where('alunoId', '==', alunoId),
    where('responsavelId', '==', responsavelId),
    where('status', '==', 'ativa'),
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { status: 'inativa', atualizadoEm: agoraTimestamp() })));
}

// getDocSeguro(), não getDoc() direto: ver decisão técnica em services/firestoreSeguro.ts — só
// UM dos dois sentidos costuma existir (o par pediu vínculo numa única direção), então o
// sentido que não existe sempre negava com permission-denied e o Promise.all() original
// propagava — na prática, matricularAluno() nunca conseguia confirmar vínculo algum.
async function vinculoAceitoExiste(id: string): Promise<boolean> {
  const vinculo = await getDocSeguro<Vinculo>(doc(db, COLECAO_VINCULOS, id));
  return vinculo?.status === 'aceito';
}

// RN05, RN06: vínculo bilateral aceito, checado nos dois sentidos pelo ID determinístico —
// mesmo padrão usado por vinculoAtivoEntre() no firestore.rules
export async function existeVinculoAtivoEntre(uidA: string, uidB: string): Promise<boolean> {
  const [ativoAB, ativoBA] = await Promise.all([
    vinculoAceitoExiste(`${uidA}_${uidB}`),
    vinculoAceitoExiste(`${uidB}_${uidA}`),
  ]);
  return ativoAB || ativoBA;
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

// RF09: vínculos aceitos em que a academia é a destinatária — usado no painel da academia para
// contar/listar professores e alunos vinculados. A regra de leitura de `vinculos` já permite
// isso (destinatarioId == meuId()), sem precisar de nenhuma leitura ampla nova.
export async function listarVinculosAceitosDaAcademia(
  academiaId: string,
  perfilSolicitante: PerfilSolicitante,
): Promise<Vinculo[]> {
  const q = query(
    collection(db, COLECAO_VINCULOS),
    where('destinatarioId', '==', academiaId),
    where('perfilSolicitante', '==', perfilSolicitante),
    where('status', '==', 'aceito'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Vinculo);
}
