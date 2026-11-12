// RN05: avisa a raiz do aluno (AlunoRaiz) que os vínculos mudaram — ex.: o aluno saiu do último
// vínculo ativo e precisa cair no bloqueio, sem reiniciar o app. A raiz é quem checa vínculo
// ativo; as telas só notificam.
type Ouvinte = () => void;

const ouvintes = new Set<Ouvinte>();

export function aoMudarVinculos(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function notificarMudancaDeVinculos(): void {
  ouvintes.forEach((ouvinte) => ouvinte());
}
