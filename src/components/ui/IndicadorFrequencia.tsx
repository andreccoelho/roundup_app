// IndicadorFrequencia — pontos de presença recente (RF24, Ciclo 3). Sem consumidor real ainda.
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';

interface IndicadorFrequenciaProps {
  presencas: boolean[]; // mais recente por último
}

export default function IndicadorFrequencia({ presencas }: IndicadorFrequenciaProps) {
  const rotulo = `${presencas.filter(Boolean).length} de ${presencas.length} presenças recentes`;
  return (
    <View style={styles.container} accessibilityLabel={rotulo}>
      {presencas.map((presente, i) => (
        <View key={i} style={[styles.ponto, presente ? styles.pontoPresente : styles.pontoAusente]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: Espacamento.minimo },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  pontoPresente: { backgroundColor: Cores.superficie2 },
  pontoAusente: { backgroundColor: Cores.linha },
});
