// Toggle — liga/desliga de verdade (Switch nativo, role "switch"), no lugar das Etiquetas
// "Ativado/Desativado" improvisadas. A linha inteira é tocável; o rótulo vira o nome acessível.
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Alturas, Cores, Espacamento } from '../../theme';
import Texto from './Texto';

interface ToggleProps {
  rotulo: string;
  descricao?: string;
  valor: boolean;
  onAlterar: (valor: boolean) => void;
  desabilitado?: boolean;
}

export default function Toggle({ rotulo, descricao, valor, onAlterar, desabilitado }: ToggleProps) {
  return (
    <Pressable
      style={styles.linha}
      onPress={() => onAlterar(!valor)}
      disabled={desabilitado}
      accessibilityRole="switch"
      accessibilityLabel={rotulo}
      accessibilityHint={descricao}
      accessibilityState={{ checked: valor, disabled: Boolean(desabilitado) }}
    >
      <View style={styles.textos}>
        <Texto variante="corpoForte">{rotulo}</Texto>
        {descricao ? <Texto variante="legenda">{descricao}</Texto> : null}
      </View>
      <Switch
        value={valor}
        onValueChange={onAlterar}
        disabled={desabilitado}
        trackColor={{ false: Cores.superficie2, true: Cores.sucesso }}
        thumbColor={Cores.texto}
        // react-native-web usa activeThumbColor (teal por padrão) quando ligado.
        {...({ activeThumbColor: Cores.texto, activeTrackColor: Cores.sucesso } as object)}
        ios_backgroundColor={Cores.superficie2}
        // A linha já é o controle acessível — o Switch não é anunciado duas vezes.
        aria-hidden
        importantForAccessibility="no-hide-descendants"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    minHeight: Alturas.alvoMinimo + 12,
    paddingVertical: Espacamento.medio,
  },
  textos: { flex: 1, gap: 2 },
});
