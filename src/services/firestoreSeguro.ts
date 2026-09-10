// DECISÃO TÉCNICA (descoberta ao testar RF11/RF13 contra as regras reais, não só o emulador):
// get() num documento que NÃO EXISTE é negado com "Missing or insufficient permissions" sempre
// que a regra de leitura da coleção referencia `resource.data` sem uma guarda `resource == null
// ||` — quando o documento não existe, `resource` é null e a regra nunca chega a avaliar o
// `resource.data.get(...)` seguinte. Confirmado em `checkins`, `matriculas`, `turmas` e
// `vinculos` (mesmo formato de regra nas quatro). Isso quebra todo fluxo que verifica "esse
// documento ainda não existe" — que é o caso comum, não a exceção: aluno checando se já fez
// check-in numa sessão futura, verificando se já tem matrícula, checando vínculo num sentido
// que nunca foi solicitado. getDocSeguro() trata essa negação especificamente como "não existe";
// qualquer outro código de erro (rede, etc.) continua sendo relançado.
import { DocumentData, DocumentReference, getDoc } from 'firebase/firestore';

export async function getDocSeguro<T>(ref: DocumentReference<DocumentData>): Promise<T | null> {
  try {
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as T) : null;
  } catch (erro: any) {
    if (erro?.code === 'permission-denied') return null;
    throw erro;
  }
}
