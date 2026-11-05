// Carregamento de raiz (sessão/perfil/vínculo). Fundo do tema, logo e indicador — sem flash da
// cor errada entre a splash e a primeira tela.
import { ActivityIndicator, View } from 'react-native';
import { criarEstilos, Espacamento, useTema } from '../theme';
import Logo from './Logo';

export default function LoadingScreen() {
  const styles = useEstilos();
  const { cores } = useTema();
  return (
    <View style={styles.container} accessibilityLabel="Carregando" accessibilityRole="progressbar">
      {/* Mesma proporção do splash (imageWidth 200): a troca splash → loading não "pula". */}
      <Logo tamanho={200} style={styles.logo} />
      <ActivityIndicator size="small" color={cores.texto2} />
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Espacamento.grande, backgroundColor: c.fundo },
  logo: { marginVertical: -40 },
}));
