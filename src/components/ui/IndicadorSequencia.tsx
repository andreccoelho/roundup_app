// IndicadorSequencia — treinos consecutivos (RF21, Ciclo 2). Sem consumidor real ainda.
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, FamiliaFonte, TamanhoFonte } from '../../theme';

interface IndicadorSequenciaProps {
  dias: number;
}

export default function IndicadorSequencia({ dias }: IndicadorSequenciaProps) {
  const rotulo = dias === 1 ? 'dia seguido' : 'dias seguidos';
  return (
    <View style={styles.container} accessibilityLabel={`${dias} ${rotulo}`}>
      <Text style={styles.numero}>{dias}</Text>
      <Text style={styles.rotulo}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'baseline', gap: Espacamento.minimo },
  numero: { fontFamily: FamiliaFonte.placarBold, fontSize: TamanhoFonte.placar, color: Cores.texto },
  rotulo: { fontSize: TamanhoFonte.sm, color: Cores.texto2 },
});
