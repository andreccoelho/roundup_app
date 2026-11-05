// RF20, RN04, RN09, RNF11: classificação mensal por escopo de vínculo. A leitura do ranking é
// restrita pela regra (`meuId() in leitoresIds`), não só pelo filtro desta consulta — por isso o
// filtro `array-contains` com o próprio uid é obrigatório: é ele que deixa o Firestore provar que a
// consulta é segura (ver docs/decisoes-tecnicas.md, "prova pelo formato do filtro").
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Classificacao } from '../types';

const COLECAO = 'classificacoes';

// RF20, RN04: ranking de um escopo (academia ou professor autônomo) num período, do ponto de vista
// de `leitorId` — alunos que não participam (RNF11) só aparecem para eles mesmos
export async function listarClassificacao(
  responsavelId: string,
  periodo: string,
  leitorId: string,
): Promise<Classificacao[]> {
  const q = query(
    collection(db, COLECAO),
    where('responsavelId', '==', responsavelId),
    where('periodo', '==', periodo),
    where('leitoresIds', 'array-contains', leitorId),
    orderBy('pontos', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Classificacao);
}

// RF17: pontuação do aluno em todos os escopos e períodos (somada no client para o total de XP
// exibido no nível — RN04 e RN09 não se aplicam aqui, isso não é uma classificação, é o total
// pessoal do aluno)
export async function listarClassificacoesDoAluno(alunoId: string): Promise<Classificacao[]> {
  const q = query(collection(db, COLECAO), where('alunoId', '==', alunoId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Classificacao);
}
