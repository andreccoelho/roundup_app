// Carregamento de raiz (sessão/perfil/vínculo). Fundo do tema, marca e indicador — sem flash
// branco entre a splash e a primeira tela.
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container} accessibilityLabel="Carregando" accessibilityRole="progressbar">
      <Image source={require('../../assets/roundup_logo_invertida.png')} style={styles.logo} resizeMode="contain" accessible={false} />
      <ActivityIndicator size="small" color={Cores.texto2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Espacamento.grande, backgroundColor: Cores.fundo },
  // Mesma proporção do splash (imageWidth 200): a troca splash → loading não "pula".
  logo: { width: 200, height: 200, marginVertical: -40 },
});
