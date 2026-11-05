// IndicadorSequencia — sequência de treinos (RF21, contada por sessão agendada) como cartão
// compacto: chama preenchida no tint, número em peso forte e o rótulo. O número sobe animado
// (reduce motion: valor direto). Sem sequência, a chama fica em texto3.
import { View } from 'react-native';
import { criarEstilos, Espacamento, useTema } from '../../theme';
import { useNumeroAnimado } from '../../hooks/useNumeroAnimado';
import { IconeChama } from '../icones';
import Cartao from './Cartao';
import Texto from './Texto';

interface IndicadorSequenciaProps {
  treinos: number;
  // Sem o cartão em volta (quando já está dentro de um)
  semCartao?: boolean;
}

export default function IndicadorSequencia({ treinos, semCartao }: IndicadorSequenciaProps) {
  const exibido = useNumeroAnimado(treinos);
  const { cores } = useTema();
  const styles = useEstilos();
  const rotulo = treinos === 1 ? 'treino seguido' : 'treinos seguidos';

  const conteudo = (
    <View style={styles.linha} accessible accessibilityLabel={`Sequência: ${treinos} ${rotulo}`}>
      {/* No web um <svg> numa linha flex encolhe até sumir quando o texto ao lado não cabe */}
      <View style={styles.icone}>
        <IconeChama tamanho={28} cor={treinos > 0 ? cores.tint : cores.texto3} preenchido={treinos > 0} />
      </View>
      <View style={styles.textos}>
        <Texto variante="footnote">Sequência</Texto>
        <View style={styles.valor}>
          <Texto variante="numero">{exibido}</Texto>
          <Texto variante="subheadline">{rotulo}</Texto>
        </View>
      </View>
    </View>
  );

  return semCartao ? conteudo : <Cartao>{conteudo}</Cartao>;
}

const useEstilos = criarEstilos(() => ({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio },
  icone: { flexShrink: 0 },
  textos: { flex: 1 },
  valor: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: Espacamento.minimo + 2 },
}));
