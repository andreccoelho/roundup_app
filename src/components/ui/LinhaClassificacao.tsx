// LinhaClassificacao — linha de ranking (RF20, Ciclo 2). Lista sem bordas, separada por
// LinhaFina — não "pilha de cards" (ver DESIGN_BRIEF.md). Sem consumidor real ainda.
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, FamiliaFonte, TamanhoFonte } from '../../theme';
import Avatar from './Avatar';

interface LinhaClassificacaoProps {
  posicao: number;
  nome: string;
  pontos: number;
  fotoUrl?: string;
  destaque?: boolean; // linha do próprio aluno
}

export default function LinhaClassificacao({ posicao, nome, pontos, fotoUrl, destaque }: LinhaClassificacaoProps) {
  return (
    <View style={[styles.linha, destaque && styles.linhaDestaque]}>
      <Text style={styles.posicao}>{posicao}</Text>
      <Avatar nome={nome} fotoUrl={fotoUrl} tamanho={32} />
      <Text style={styles.nome}>{nome}</Text>
      <Text style={styles.pontos}>{pontos}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, paddingVertical: Espacamento.pequeno },
  linhaDestaque: { backgroundColor: Cores.cinzaFundo },
  posicao: { width: 24, fontFamily: FamiliaFonte.placarSemiBold, fontSize: TamanhoFonte.md, color: Cores.cinzaMedio, textAlign: 'center' },
  nome: { flex: 1, fontSize: TamanhoFonte.md, color: Cores.preto, fontWeight: '600' },
  pontos: { fontFamily: FamiliaFonte.placarSemiBold, fontSize: TamanhoFonte.md, color: Cores.preto },
});
