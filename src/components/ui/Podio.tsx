// Podio — destaque leve dos três primeiros do ranking (RF20), sem os blocos de pódio: avatares
// maiores (o 1º maior e um pouco acima), uma medalha redonda com a posição presa ao avatar, nome e
// pontos. O 1º é o único em ouro (docs/DESIGN.md); 2º e 3º usam a medalha neutra. A coluna do
// próprio aluno ganha o rótulo "Você" em tint.
import { View } from 'react-native';
import { criarEstilos, Espacamento, useTema } from '../../theme';
import Avatar from './Avatar';
import Texto from './Texto';

interface ItemPodio {
  posicao: number;
  nome: string;
  pontos: number;
  fotoUrl?: string;
  destaque?: boolean;
}

interface PodioProps {
  primeiro: ItemPodio;
  segundo?: ItemPodio;
  terceiro?: ItemPodio;
}

function Coluna({ item }: { item: ItemPodio }) {
  const { cores } = useTema();
  const styles = useEstilos();
  const campeao = item.posicao === 1;
  const tamanho = campeao ? 76 : 60;
  return (
    <View
      style={[styles.coluna, !campeao && styles.colunaLateral]}
      accessible
      accessibilityLabel={`${item.posicao}º lugar: ${item.nome}, ${item.pontos} pontos${item.destaque ? ', você' : ''}`}
    >
      <View>
        <Avatar nome={item.nome} fotoUrl={item.fotoUrl} tamanho={tamanho} />
        <View style={[styles.medalha, { backgroundColor: campeao ? cores.ouro : cores.superficieElevada, borderColor: cores.superficie }]}>
          <Texto variante="footnote" style={[styles.posicao, { color: campeao ? cores.fundo : cores.texto }]} maxFontSizeMultiplier={1.2}>
            {item.posicao}
          </Texto>
        </View>
      </View>
      <Texto variante="subheadline" cor="texto" numberOfLines={1} alinhamento="center" style={styles.nome}>
        {item.nome}
      </Texto>
      <Texto variante="headline" style={styles.pontos}>
        {item.pontos}
      </Texto>
      {item.destaque ? (
        <Texto variante="caption" cor="tint">
          Você
        </Texto>
      ) : null}
    </View>
  );
}

export default function Podio({ primeiro, segundo, terceiro }: PodioProps) {
  const styles = useEstilos();
  return (
    <View style={styles.container}>
      {segundo ? <Coluna item={segundo} /> : <View style={styles.colunaVazia} />}
      <Coluna item={primeiro} />
      {terceiro ? <Coluna item={terceiro} /> : <View style={styles.colunaVazia} />}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  container: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: Espacamento.padrao, paddingVertical: Espacamento.padrao },
  coluna: { flex: 1, maxWidth: 120, alignItems: 'center', gap: 2 },
  colunaLateral: { marginTop: Espacamento.grande },
  colunaVazia: { flex: 1, maxWidth: 120 },
  medalha: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posicao: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  nome: { marginTop: Espacamento.pequeno, maxWidth: '100%' },
  pontos: { fontVariant: ['tabular-nums'] },
}));
