// script.md, item 4: "Ranking/leaderboard: top 3 precisa se destacar visualmente de forma óbvia
// (não só numeração), como um pódio ou disposição assimétrica." Ordem visual clássica (2º-1º-3º),
// 1º lugar com avatar maior — assimetria de tamanho, não de cor (paleta monocromática continua
// valendo, RN09/DESIGN_BRIEF.md). Usado só para os 3 primeiros; da 4ª posição em diante continua
// LinhaClassificacao normal.
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, FamiliaFonte, Raios, TamanhoFonte } from '../../theme';
import Avatar from './Avatar';

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

function Coluna({ item, tamanhoAvatar }: { item: ItemPodio; tamanhoAvatar: number }) {
  return (
    <View style={[styles.coluna, item.destaque && styles.colunaDestaque]}>
      <View style={styles.numeroBadge}>
        <Text style={styles.numeroTexto}>{item.posicao}</Text>
      </View>
      <Avatar nome={item.nome} fotoUrl={item.fotoUrl} tamanho={tamanhoAvatar} />
      <Text style={styles.nome} numberOfLines={1}>
        {item.nome}
      </Text>
      <Text style={styles.pontos}>{item.pontos}</Text>
    </View>
  );
}

export default function Podio({ primeiro, segundo, terceiro }: PodioProps) {
  return (
    <View style={styles.container}>
      {segundo ? <Coluna item={segundo} tamanhoAvatar={44} /> : <View style={styles.colunaVazia} />}
      <Coluna item={primeiro} tamanhoAvatar={64} />
      {terceiro ? <Coluna item={terceiro} tamanhoAvatar={44} /> : <View style={styles.colunaVazia} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Espacamento.padrao,
    paddingVertical: Espacamento.grande,
  },
  coluna: { alignItems: 'center', width: 88, gap: Espacamento.minimo, paddingVertical: Espacamento.pequeno, borderRadius: Raios.pequeno },
  colunaDestaque: { backgroundColor: Cores.superficie1 },
  colunaVazia: { width: 88 },
  numeroBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: Cores.superficie2, alignItems: 'center', justifyContent: 'center' },
  numeroTexto: { color: Cores.texto, fontSize: TamanhoFonte.xs, fontWeight: '700', fontFamily: FamiliaFonte.placarSemiBold },
  nome: { fontSize: TamanhoFonte.sm, color: Cores.texto, fontWeight: '600', maxWidth: 84, textAlign: 'center' },
  pontos: { fontFamily: FamiliaFonte.placarSemiBold, fontSize: TamanhoFonte.md, color: Cores.texto },
});
