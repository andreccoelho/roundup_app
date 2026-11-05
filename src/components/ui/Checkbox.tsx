// Checkbox — círculo com ✓, como no app Lembretes (o iOS não tem caixa quadrada). Vazio =
// contorno em texto3; marcado = círculo em tintCheio com ✓ branco. Linha inteira tocável.
import { Pressable, View } from 'react-native';
import { Alturas, criarEstilos, Espacamento } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import { hapticaSelecao } from '../../utils/haptica';
import { IconeCheck } from '../icones';
import Texto from './Texto';

interface CheckboxProps {
  rotulo: string;
  marcado: boolean;
  onAlterar: (marcado: boolean) => void;
  erro?: boolean;
}

export default function Checkbox({ rotulo, marcado, onAlterar, erro }: CheckboxProps) {
  const { focado, propsFoco } = useFocoVisivel();
  const styles = useEstilos();
  return (
    <Pressable
      style={[styles.linha, estiloSemOutline, focado && estiloAnelFoco]}
      onPress={() => {
        hapticaSelecao();
        onAlterar(!marcado);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcado }}
      // react-native-web não emite aria-checked="false" a partir do accessibilityState.
      aria-checked={marcado}
      accessibilityLabel={rotulo}
      {...propsFoco}
    >
      <View style={[styles.circulo, erro && styles.circuloErro, marcado && styles.circuloMarcado]}>
        {marcado ? <IconeCheck tamanho={14} cor="#FFFFFF" espessura={2.6} /> : null}
      </View>
      <Texto variante="body" style={styles.texto}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const useEstilos = criarEstilos((c) => ({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: Alturas.alvoMinimo },
  circulo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: c.texto3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloErro: { borderColor: c.perigo },
  circuloMarcado: { backgroundColor: c.tintCheio, borderColor: c.tintCheio },
  texto: { flex: 1 },
}));
