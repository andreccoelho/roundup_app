// Visão (só apresentação) da Classificação do Aluno — RF20. Cartão de destaque com "sua posição"
// (quando o aluno está fora dos três primeiros), destaque leve dos três primeiros (Podio) e a lista
// agrupada da 4ª posição em diante, com a linha do próprio aluno em tint suave.
//
// RN04: o ranking é mensal de verdade (um documento de classificação por mês), então o texto diz
// "ranking mensal" (desfaz o R-04 de docs/DECISOES_PENDENTES.md). RNF11: quem não participa vê um
// aviso de que só ele enxerga a própria pontuação.
import { View } from 'react-native';
import { criarEstilos, Espacamento } from '../../theme';
import Podio from '../../components/ui/Podio';
import LinhaClassificacao from '../../components/ui/LinhaClassificacao';
import GrupoLista from '../../components/ui/GrupoLista';
import Cartao from '../../components/ui/Cartao';
import Texto from '../../components/ui/Texto';

export interface LinhaRanking {
  alunoId: string;
  nome: string;
  pontos: number;
  fotoUrl?: string;
}

interface ClassificacaoVisaoProps {
  linhas: LinhaRanking[];
  usuarioId?: string;
  mes?: string;               // "novembro de 2026"
  participa?: boolean;
}

export default function ClassificacaoVisao({ linhas, usuarioId, mes, participa = true }: ClassificacaoVisaoProps) {
  const styles = useEstilos();
  const top3 = linhas.slice(0, 3);
  const resto = linhas.slice(3);
  const minhaPosicao = linhas.findIndex((l) => l.alunoId === usuarioId);
  const item = (i: number) =>
    top3[i] ? { posicao: i + 1, nome: top3[i].nome, pontos: top3[i].pontos, fotoUrl: top3[i].fotoUrl, destaque: top3[i].alunoId === usuarioId } : undefined;

  return (
    <View>
      <Texto variante="subheadline" style={styles.legenda}>
        {`Ranking mensal${mes ? ` de ${mes}` : ''}: pontos dos treinos validados neste mês na sua academia ou professor.`}
      </Texto>
      {!participa ? (
        <Texto variante="subheadline" style={styles.legenda}>
          Você não participa da classificação: só você vê a sua pontuação. Dá para mudar isso no Perfil.
        </Texto>
      ) : null}

      {minhaPosicao >= 3 ? (
        <Cartao destaque style={styles.minha}>
          <View style={styles.minhaLinha} accessible accessibilityLabel={`Sua posição: ${minhaPosicao + 1}º, ${linhas[minhaPosicao].pontos} pontos`}>
            <View>
              <Texto variante="footnote">Sua posição</Texto>
              <Texto variante="numeroGrande">{`${minhaPosicao + 1}º`}</Texto>
            </View>
            <View style={styles.minhaPontos}>
              <Texto variante="footnote">Pontos</Texto>
              <Texto variante="numeroGrande" cor="tint">
                {linhas[minhaPosicao].pontos}
              </Texto>
            </View>
          </View>
        </Cartao>
      ) : null}

      {top3[0] ? (
        <Cartao>
          <Podio primeiro={item(0)!} segundo={item(1)} terceiro={item(2)} />
        </Cartao>
      ) : null}

      {resto.length > 0 ? (
        <GrupoLista titulo={`${linhas.length} atletas`}>
          {resto.map((linha, i) => (
            <LinhaClassificacao
              key={linha.alunoId}
              posicao={i + 4}
              nome={linha.nome}
              pontos={linha.pontos}
              fotoUrl={linha.fotoUrl}
              destaque={linha.alunoId === usuarioId}
            />
          ))}
        </GrupoLista>
      ) : null}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  legenda: { marginBottom: Espacamento.padrao },
  minha: { marginBottom: Espacamento.medio },
  minhaLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  minhaPontos: { alignItems: 'flex-end' },
}));
