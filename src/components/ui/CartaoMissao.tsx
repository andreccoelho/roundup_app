// CartaoMissao — missão com progresso (RF18), como linha de lista (sem card com borda): título,
// critério, barra segmentada por unidade da meta (até 10 segmentos; acima disso, barra contínua)
// e o placar "2/3". Concluída: barra cheia em sucesso + selo ✓.
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import { IconeCheck } from '../icones';
import Texto from './Texto';

interface CartaoMissaoProps {
  titulo: string;
  descricao: string;
  progressoAtual: number;
  meta: number;
  concluida?: boolean;
  pontos?: number;
}

export default function CartaoMissao({ titulo, descricao, progressoAtual, meta, concluida, pontos }: CartaoMissaoProps) {
  const atual = Math.min(progressoAtual, meta);
  const segmentado = meta > 0 && meta <= 10;
  const progresso = meta > 0 ? atual / meta : 0;
  const corCheia = concluida ? Cores.sucesso : Cores.texto;

  return (
    <View
      style={styles.linha}
      accessible
      accessibilityLabel={`${titulo}. ${descricao}. ${progressoAtual} de ${meta}${concluida ? ', concluída' : ''}${pontos ? `, vale ${pontos} pontos` : ''}`}
    >
      <View style={styles.cabecalho}>
        <View style={styles.textos}>
          <Texto variante="corpoForte">{titulo}</Texto>
          <Texto variante="legenda">{descricao}</Texto>
        </View>
        <View style={styles.placar}>
          {concluida ? (
            <View style={styles.concluida}>
              <IconeCheck tamanho={16} cor={Cores.sucesso} />
              <Texto variante="rotuloPlacar" cor="sucesso">
                Concluída
              </Texto>
            </View>
          ) : (
            <View style={styles.contagem}>
              <Texto variante="placar">{atual}</Texto>
              <Texto variante="rotuloPlacar" cor="texto3">{`/ ${meta}`}</Texto>
            </View>
          )}
          {pontos ? (
            <Texto variante="rotuloPlacar" cor="texto3">{`+${pontos} XP`}</Texto>
          ) : null}
        </View>
      </View>
      <View style={styles.trilha} aria-hidden>
        {segmentado ? (
          Array.from({ length: meta }).map((_, i) => (
            <View key={i} style={styles.segmento}>
              <View style={i < atual ? [styles.cheio, { backgroundColor: corCheia }] : styles.vazio} />
            </View>
          ))
        ) : (
          <View style={styles.continua}>
            <View style={styles.vazio} />
            <View style={[styles.cheio, styles.cheioContinuo, { width: `${progresso * 100}%`, backgroundColor: corCheia }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { paddingVertical: Espacamento.padrao },
  cabecalho: { flexDirection: 'row', gap: Espacamento.medio, alignItems: 'flex-start' },
  textos: { flex: 1, gap: 2 },
  placar: { alignItems: 'flex-end', gap: 2 },
  contagem: { flexDirection: 'row', alignItems: 'baseline', gap: Espacamento.minimo },
  concluida: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.minimo, minHeight: 28 },
  trilha: { flexDirection: 'row', gap: 3, height: 6, marginTop: Espacamento.medio },
  segmento: { flex: 1, justifyContent: 'center' },
  continua: { flex: 1, justifyContent: 'center' },
  vazio: { height: 2, backgroundColor: Cores.linhaForte },
  cheio: { height: 6 },
  cheioContinuo: { position: 'absolute', left: 0, top: 0 },
});
