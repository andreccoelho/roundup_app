// CabecalhoSecao — título de seção em Oswald caixa alta (Texto "secao"), com contador e/ou ação à
// direita. Substitui os ~10 estilos `secaoTitulo` recompostos à mão em cada tela.
import { StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
import Botao from './Botao';
import Texto from './Texto';

interface CabecalhoSecaoProps {
  titulo: string;
  contador?: string | number;
  acaoTitulo?: string;
  onAcao?: () => void;
  // Sem margem superior (primeira seção logo abaixo de um bloco que já tem respiro).
  semMargem?: boolean;
}

export default function CabecalhoSecao({ titulo, contador, acaoTitulo, onAcao, semMargem }: CabecalhoSecaoProps) {
  return (
    <View style={[styles.linha, !semMargem && styles.margem]}>
      <Texto variante="footnote" cabecalho style={styles.titulo}>
        {titulo}
      </Texto>
      {contador !== undefined ? (
        <Texto variante="caption" cor="texto3">
          {String(contador)}
        </Texto>
      ) : null}
      {acaoTitulo && onAcao ? <Botao variante="texto" titulo={acaoTitulo} onPress={onAcao} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.pequeno, minHeight: 32, marginBottom: Espacamento.pequeno },
  margem: { marginTop: Espacamento.grande },
  titulo: { flex: 1 },
});
