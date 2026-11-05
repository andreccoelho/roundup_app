// Toggle — linha de lista com Switch nativo (role "switch"), trilha ligada no tint e haptic de
// seleção ao alternar. A linha inteira é tocável e o rótulo vira o nome acessível. Desenha o
// próprio separador dentro de um GrupoLista. No web o Switch vira um <input> focável dentro da
// linha (que já é o switch acessível): lá o interruptor é só desenho, com as mesmas cores.
import { Platform, Pressable, Switch, View } from 'react-native';
import { Alturas, criarEstilos, Espacamento, useTema } from '../../theme';
import { hapticaSelecao } from '../../utils/haptica';
import LinhaFina from '../LinhaFina';
import Texto from './Texto';

interface ToggleProps {
  rotulo: string;
  descricao?: string;
  valor: boolean;
  onAlterar: (valor: boolean) => void;
  desabilitado?: boolean;
  separadorAcima?: boolean;
}

function Toggle({ rotulo, descricao, valor, onAlterar, desabilitado, separadorAcima }: ToggleProps) {
  const { cores } = useTema();
  const styles = useEstilos();

  function alternar(novo: boolean) {
    hapticaSelecao();
    onAlterar(novo);
  }

  return (
    <View>
      {separadorAcima ? <LinhaFina recuo={Espacamento.padrao} /> : null}
      <Pressable
        style={[styles.linha, desabilitado && styles.desabilitado]}
        onPress={() => alternar(!valor)}
        disabled={desabilitado}
        accessibilityRole="switch"
        accessibilityLabel={rotulo}
        accessibilityHint={descricao}
        accessibilityState={{ checked: valor, disabled: Boolean(desabilitado) }}
        aria-checked={valor}
      >
        <View style={styles.textos}>
          <Texto variante="body">{rotulo}</Texto>
          {descricao ? <Texto variante="footnote">{descricao}</Texto> : null}
        </View>
        {Platform.OS === 'web' ? (
          <View style={[styles.trilha, { backgroundColor: valor ? cores.tintCheio : cores.preenchimentoOpaco }]} aria-hidden>
            <View style={[styles.botao, valor && styles.botaoLigado]} />
          </View>
        ) : (
        <Switch
          value={valor}
          onValueChange={alternar}
          disabled={desabilitado}
          trackColor={{ false: cores.preenchimento, true: cores.tintCheio }}
          thumbColor="#FFFFFF"
          // react-native-web usa activeThumbColor/activeTrackColor quando ligado.
          {...({ activeThumbColor: '#FFFFFF', activeTrackColor: cores.tintCheio } as object)}
          ios_backgroundColor={cores.preenchimento}
          // A linha já é o controle acessível — o Switch não é anunciado duas vezes.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
        />
        )}
      </Pressable>
    </View>
  );
}

Toggle.desenhaSeparador = true;

export default Toggle;

const useEstilos = criarEstilos(() => ({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    minHeight: Alturas.linha,
    paddingVertical: Espacamento.pequeno,
    paddingHorizontal: Espacamento.padrao,
  },
  textos: { flex: 1, gap: 2 },
  desabilitado: { opacity: 0.5 },
  trilha: { width: 51, height: 31, borderRadius: 16, padding: 2, justifyContent: 'center' },
  botao: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#FFFFFF', boxShadow: '0px 2px 4px rgba(0,0,0,0.2)' },
  botaoLigado: { alignSelf: 'flex-end' },
}));
