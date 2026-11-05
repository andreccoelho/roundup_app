// IndicadorFrequencia — presença nas últimas sessões (RF24) como pontos: presença = ponto cheio no
// tint; falta = anel vazio em texto3 (forma diferente, não só cor; o anel passa 3:1 nos dois temas).
import { View } from 'react-native';
import { criarEstilos } from '../../theme';

interface IndicadorFrequenciaProps {
  presencas: boolean[]; // mais recente por último
}

export default function IndicadorFrequencia({ presencas }: IndicadorFrequenciaProps) {
  const styles = useEstilos();
  const rotulo = `${presencas.filter(Boolean).length} de ${presencas.length} presenças recentes`;
  return (
    <View style={styles.container} accessible accessibilityLabel={rotulo}>
      {presencas.map((presente, i) => (
        <View key={i} style={[styles.ponto, presente ? styles.presente : styles.ausente]} />
      ))}
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  container: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  ponto: { width: 9, height: 9, borderRadius: 4.5 },
  presente: { backgroundColor: c.tint },
  ausente: { borderWidth: 1.5, borderColor: c.texto3 },
}));
