// LinhaClassificacao — linha de ranking (RF20) da 4ª posição em diante, sobre o fundo, separada por
// LinhaFina. A linha do próprio aluno ganha fundo superficie1 e barra lateral de 3px em acento.
import { StyleSheet, View } from 'react-native';
import { Alturas, Cores, Espacamento } from '../../theme';
import Avatar from './Avatar';
import Texto from './Texto';

interface LinhaClassificacaoProps {
  posicao: number;
  nome: string;
  pontos: number;
  fotoUrl?: string;
  destaque?: boolean; // linha do próprio aluno
}

export default function LinhaClassificacao({ posicao, nome, pontos, fotoUrl, destaque }: LinhaClassificacaoProps) {
  return (
    <View
      style={[styles.linha, destaque && styles.linhaDestaque]}
      accessible
      accessibilityLabel={`${posicao}º lugar: ${nome}, ${pontos} pontos${destaque ? ', você' : ''}`}
    >
      <Texto variante="numero" cor={destaque ? 'texto' : 'texto3'} style={styles.posicao}>
        {posicao}
      </Texto>
      <Avatar nome={nome} fotoUrl={fotoUrl} tamanho={36} />
      <View style={styles.nome}>
        <Texto variante="headline" numberOfLines={1}>
          {nome}
        </Texto>
        {destaque ? (
          <Texto variante="caption" cor="texto2">
            Você
          </Texto>
        ) : null}
      </View>
      <Texto variante="numero">{pontos}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    minHeight: Alturas.botaoHero,
    paddingVertical: Espacamento.pequeno,
    paddingHorizontal: Espacamento.pequeno,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  linhaDestaque: { backgroundColor: Cores.superficie1, borderLeftColor: Cores.acento },
  posicao: { width: 32, textAlign: 'center' },
  nome: { flex: 1 },
});
