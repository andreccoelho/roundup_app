// RF20, RN04, RN09: classificação por escopo de vínculo. PROVISÓRIO — ver
// docs/DECISOES_PENDENTES.md: RN04 (janela de tempo) não reseta pontos por período ainda; RN09
// (escopo por vínculo) é garantido pelo filtro desta consulta, não pela regra de leitura (que é
// aberta a qualquer autenticado, mesmo padrão já aceito para turmas ativas).
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Classificacao } from '../types';

const COLECAO = 'classificacoes';

// RF20: ranking de um escopo (academia ou professor autônomo), ordenado por pontos
export async function listarClassificacao(responsavelId: string): Promise<Classificacao[]> {
  const q = query(collection(db, COLECAO), where('responsavelId', '==', responsavelId), orderBy('pontos', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Classificacao);
}

// RF17: pontuação do aluno em todos os escopos (somada no client para o total de XP exibido no
// nível — RN09 não se aplica aqui, isso não é uma classificação, é o total pessoal do aluno)
export async function listarClassificacoesDoAluno(alunoId: string): Promise<Classificacao[]> {
  const q = query(collection(db, COLECAO), where('alunoId', '==', alunoId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Classificacao);
}
