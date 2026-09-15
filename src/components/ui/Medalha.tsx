// Medalha — marco conquistado (RF19, Ciclo 2). Sem consumidor real ainda: `graduacoes` e o
// crédito de pontos seguem bloqueados em firestore.rules/Ciclo 2-3.
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';

interface MedalhaProps {
  rotulo: string;
  conquistada?: boolean;
}

export default function Medalha({ rotulo, conquistada = true }: MedalhaProps) {
  return (
    <View style={styles.container} accessibilityLabel={`Medalha: ${rotulo}${conquistada ? '' : ', ainda não conquistada'}`}>
      <View style={[styles.circulo, !conquistada && styles.circuloBloqueada]} />
      <Text style={[styles.rotulo, !conquistada && styles.rotuloBloqueada]}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 72 },
  circulo: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Cores.preto, backgroundColor: Cores.cinzaFundo },
  circuloBloqueada: { borderColor: Cores.cinzaBorda, opacity: 0.5 },
  rotulo: { fontSize: TamanhoFonte.xs, color: Cores.preto, marginTop: Espacamento.minimo, textAlign: 'center' },
  rotuloBloqueada: { color: Cores.cinzaClaro },
});
