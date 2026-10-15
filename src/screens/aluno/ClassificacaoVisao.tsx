// Visão (só apresentação) da Classificação do Aluno — RF20. Pódio para o top 3, faixa "sua
// posição" quando o aluno está fora do pódio, e a lista da 4ª posição em diante.
//
// O texto não diz "ranking mensal": a janela de tempo (RN04) não está implementada e a pontuação
// é cumulativa (docs/DECISOES_PENDENTES.md, item 1) — o rótulo antigo prometia algo que o app não
// faz (RELATORIO_UI_UX.md, UX-07).
import { StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
import Podio from '../../components/ui/Podio';
import LinhaClassificacao from '../../components/ui/LinhaClassificacao';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import Cartao from '../../components/ui/Cartao';
import Texto from '../../components/ui/Texto';
import LinhaFina from '../../components/LinhaFina';

export interface LinhaRanking {
  alunoId: string;
  nome: string;
  pontos: number;
  fotoUrl?: string;
}

interface ClassificacaoVisaoProps {
  linhas: LinhaRanking[];
  usuarioId?: string;
}

export default function ClassificacaoVisao({ linhas, usuarioId }: ClassificacaoVisaoProps) {
  const top3 = linhas.slice(0, 3);
  const resto = linhas.slice(3);
  const minhaPosicao = linhas.findIndex((l) => l.alunoId === usuarioId);
  const item = (i: number) =>
    top3[i] ? { posicao: i + 1, nome: top3[i].nome, pontos: top3[i].pontos, fotoUrl: top3[i].fotoUrl, destaque: top3[i].alunoId === usuarioId } : undefined;

  return (
    <View>
      <Texto variante="legenda" style={styles.legenda}>
        Pontos acumulados nos treinos validados da sua academia ou professor.
      </Texto>

      {minhaPosicao >= 3 ? (
        <Cartao style={styles.minha}>
          <View style={styles.minhaLinha} accessible accessibilityLabel={`Sua posição: ${minhaPosicao + 1}º, ${linhas[minhaPosicao].pontos} pontos`}>
            <View>
              <Texto variante="rotuloPlacar">Sua posição</Texto>
              <Texto variante="placarGrande">{`${minhaPosicao + 1}º`}</Texto>
            </View>
            <View style={styles.minhaPontos}>
              <Texto variante="rotuloPlacar">Pontos</Texto>
              <Texto variante="placar">{linhas[minhaPosicao].pontos}</Texto>
            </View>
          </View>
        </Cartao>
      ) : null}

      {top3[0] ? <Podio primeiro={item(0)!} segundo={item(1)} terceiro={item(2)} /> : null}

      {resto.length > 0 ? (
        <>
          <CabecalhoSecao titulo="Classificação" contador={`${linhas.length} atletas`} />
          {resto.map((linha, i) => (
            <View key={linha.alunoId}>
              {i > 0 ? <LinhaFina /> : null}
              <LinhaClassificacao posicao={i + 4} nome={linha.nome} pontos={linha.pontos} fotoUrl={linha.fotoUrl} destaque={linha.alunoId === usuarioId} />
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  legenda: { marginBottom: Espacamento.padrao },
  minha: { marginBottom: Espacamento.padrao },
  minhaLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  minhaPontos: { alignItems: 'flex-end' },
});
