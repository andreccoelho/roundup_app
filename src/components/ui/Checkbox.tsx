// Checkbox — caixa com ✓ (antes era um quadrado preenchido sem marca). Linha inteira tocável.
import { Pressable, StyleSheet, View } from 'react-native';
import { Alturas, Cores, Espacamento, Raios } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
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
  return (
    <Pressable
      style={[styles.linha, estiloSemOutline, focado && estiloAnelFoco]}
      onPress={() => onAlterar(!marcado)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcado }}
      // react-native-web não emite aria-checked="false" a partir do accessibilityState.
      aria-checked={marcado}
      accessibilityLabel={rotulo}
      {...propsFoco}
    >
      <View style={[styles.caixa, erro && styles.caixaErro, marcado && styles.caixaMarcada]}>
        {marcado ? <IconeCheck tamanho={16} cor={Cores.sobreCor} espessura={2.5} /> : null}
      </View>
      <Texto variante="body" style={styles.texto}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: Alturas.alvoMinimo },
  caixa: {
    width: 24,
    height: 24,
    borderRadius: Raios.vivo,
    borderWidth: 1.5,
    borderColor: Cores.linhaForte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caixaErro: { borderColor: Cores.perigo },
  caixaMarcada: { backgroundColor: Cores.texto, borderColor: Cores.texto },
  texto: { flex: 1 },
});
