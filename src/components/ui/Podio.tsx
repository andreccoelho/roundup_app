// Podio — top 3 do ranking (RF20) como pódio de verdade: blocos com alturas 1º > 2º > 3º na ordem
// visual 2º-1º-3º, posição em placar dentro do bloco. O 1º é o único em ouro (docs/DESIGN.md).
// A coluna do próprio aluno ganha o traço de acento no topo do bloco.
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento, Raios } from '../../theme';
import { IconeCinturao } from '../icones';
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

const ALTURA_BLOCO: Record<number, number> = { 1: 104, 2: 76, 3: 56 };

function Coluna({ item }: { item: ItemPodio }) {
  const campeao = item.posicao === 1;
  return (
    <View
      style={styles.coluna}
      accessible
      accessibilityLabel={`${item.posicao}º lugar: ${item.nome}, ${item.pontos} pontos${item.destaque ? ', você' : ''}`}
    >
      {campeao ? <IconeCinturao tamanho={28} cor={Cores.ouro} /> : null}
      <Avatar nome={item.nome} fotoUrl={item.fotoUrl} tamanho={campeao ? 64 : 48} />
      <Texto variante="headline" numberOfLines={1} alinhamento="center" style={styles.nome}>
        {item.nome}
      </Texto>
      <Texto variante="numero" cor={campeao ? 'ouro' : 'texto'}>
        {item.pontos}
      </Texto>
      <View
        style={[
          styles.bloco,
          { height: ALTURA_BLOCO[item.posicao] ?? 48 },
          campeao ? styles.blocoOuro : null,
          item.destaque && styles.blocoDestaque,
        ]}
      >
        <Texto variante="numeroGrande" cor={campeao ? 'sobreTint' : 'texto2'}>
          {item.posicao}
        </Texto>
      </View>
    </View>
  );
}

export default function Podio({ primeiro, segundo, terceiro }: PodioProps) {
  return (
    <View style={styles.container}>
      {segundo ? <Coluna item={segundo} /> : <View style={styles.colunaVazia} />}
      <Coluna item={primeiro} />
      {terceiro ? <Coluna item={terceiro} /> : <View style={styles.colunaVazia} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Espacamento.pequeno,
    paddingTop: Espacamento.padrao,
    borderBottomWidth: 1,
    borderBottomColor: Cores.linhaForte,
  },
  coluna: { flex: 1, maxWidth: 120, alignItems: 'center', gap: Espacamento.minimo },
  colunaVazia: { flex: 1, maxWidth: 120 },
  nome: { maxWidth: '100%' },
  bloco: {
    alignSelf: 'stretch',
    marginTop: Espacamento.minimo,
    backgroundColor: Cores.superficie2,
    borderTopLeftRadius: Raios.vivo,
    borderTopRightRadius: Raios.vivo,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Espacamento.pequeno,
  },
  blocoOuro: { backgroundColor: Cores.ouro },
  blocoDestaque: { borderTopWidth: 3, borderTopColor: Cores.acento },
});
