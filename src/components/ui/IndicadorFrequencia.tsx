// IndicadorFrequencia — presença nas últimas sessões (RF24): marcas de round. Presença = bloco
// cheio em `texto`; falta = traço em `linhaForte` (forma diferente, não só cor).
import { StyleSheet, View } from 'react-native';
import { Cores } from '../../theme';

interface IndicadorFrequenciaProps {
  presencas: boolean[]; // mais recente por último
}

export default function IndicadorFrequencia({ presencas }: IndicadorFrequenciaProps) {
  const rotulo = `${presencas.filter(Boolean).length} de ${presencas.length} presenças recentes`;
  return (
    <View style={styles.container} accessible accessibilityLabel={rotulo}>
      {presencas.map((presente, i) => (
        <View key={i} style={styles.casa}>
          <View style={presente ? styles.presente : styles.ausente} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 3, height: 14, alignItems: 'center' },
  casa: { width: 8, height: 14, justifyContent: 'center' },
  presente: { height: 14, backgroundColor: Cores.texto, borderRadius: 1 },
  ausente: { height: 2, backgroundColor: Cores.linhaForte },
});
