// IndicadorSequencia — dias seguidos com check-in validado (RF21): chama + número de placar +
// rótulo em caixa alta. O número sobe animado (reduce motion: valor direto).
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import { useNumeroAnimado } from '../../hooks/useNumeroAnimado';
import { IconeChama } from '../icones';
import Texto from './Texto';

interface IndicadorSequenciaProps {
  dias: number;
}

export default function IndicadorSequencia({ dias }: IndicadorSequenciaProps) {
  const exibido = useNumeroAnimado(dias);
  const rotulo = dias === 1 ? 'dia seguido' : 'dias seguidos';
  return (
    <View style={styles.container} accessible accessibilityLabel={`Sequência: ${dias} ${rotulo}`}>
      <IconeChama tamanho={28} cor={dias > 0 ? Cores.texto : Cores.texto3} />
      <Texto variante="placarGrande">{exibido}</Texto>
      <Texto variante="rotuloPlacar" style={styles.rotulo}>
        {rotulo}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.pequeno },
  rotulo: { maxWidth: 72 },
});
