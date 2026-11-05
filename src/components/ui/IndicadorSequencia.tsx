// IndicadorSequencia — treinos seguidos com check-in validado, contados por sessão agendada (RF21): chama + número de placar +
// rótulo em caixa alta. O número sobe animado (reduce motion: valor direto).
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import { useNumeroAnimado } from '../../hooks/useNumeroAnimado';
import { IconeChama } from '../icones';
import Texto from './Texto';

interface IndicadorSequenciaProps {
  treinos: number;
}

export default function IndicadorSequencia({ treinos }: IndicadorSequenciaProps) {
  const exibido = useNumeroAnimado(treinos);
  const rotulo = treinos === 1 ? 'treino seguido' : 'treinos seguidos';
  return (
    <View style={styles.container} accessible accessibilityLabel={`Sequência: ${treinos} ${rotulo}`}>
      <IconeChama tamanho={28} cor={treinos > 0 ? Cores.texto : Cores.texto3} />
      <Texto variante="numeroGrande">{exibido}</Texto>
      <Texto variante="caption" style={styles.rotulo}>
        {rotulo}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.pequeno },
  rotulo: { maxWidth: 72 },
});
