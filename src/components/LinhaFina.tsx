// Separador fino (hairline) translúcido, no padrão das listas do iOS. `recuo` afasta o início da
// linha da borda esquerda — em listas agrupadas o separador começa onde o texto começa.
import { StyleSheet, View } from 'react-native';
import { criarEstilos } from '../theme';

interface LinhaFinaProps {
  recuo?: number;
  // Mantido por compatibilidade com a direção anterior: hoje é a mesma linha simples.
  corda?: boolean;
}

export default function LinhaFina({ recuo = 0 }: LinhaFinaProps) {
  const styles = useEstilos();
  return <View style={[styles.linha, recuo ? { marginLeft: recuo } : null]} aria-hidden />;
}

const useEstilos = criarEstilos((c) => ({
  linha: { height: StyleSheet.hairlineWidth, backgroundColor: c.separador },
}));
