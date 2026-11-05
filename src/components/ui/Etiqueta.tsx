// Etiqueta — chip em cápsula (docs/DESIGN.md). Três usos:
//  - estática (sem onPress): rótulo informativo, ex.: modalidades no perfil;
//  - seleção única (`modo="unico"`, padrão): nível da turma, turma ativa — role radio;
//  - seleção múltipla (`modo="multiplo"`): modalidades, dias da semana — role checkbox.
// Não selecionada = `preenchimento` com rótulo em `texto`; selecionada = tintCheio com rótulo
// branco (5,4:1), como os filtros do app Fitness. Alvo de toque de 44 por hitSlop.
import { Pressable, Text } from 'react-native';
import { criarEstilos, Espacamento, Raios, Tipografia } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import { hapticaSelecao } from '../../utils/haptica';

interface EtiquetaProps {
  texto: string;
  selecionada?: boolean;
  onPress?: () => void;
  desabilitada?: boolean;
  modo?: 'unico' | 'multiplo';
  accessibilityLabel?: string;
}

export default function Etiqueta({ texto, selecionada, onPress, desabilitada, modo = 'unico', accessibilityLabel }: EtiquetaProps) {
  const { focado, propsFoco } = useFocoVisivel();
  const styles = useEstilos();

  if (!onPress) {
    return <Text style={[styles.etiqueta, styles.estatica, styles.texto, styles.textoEstatico]}>{texto}</Text>;
  }

  return (
    <Pressable
      onPress={() => {
        hapticaSelecao();
        onPress();
      }}
      disabled={desabilitada}
      hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
      accessibilityRole={modo === 'multiplo' ? 'checkbox' : 'radio'}
      accessibilityLabel={accessibilityLabel ?? texto}
      accessibilityState={{ checked: Boolean(selecionada), disabled: Boolean(desabilitada) }}
      aria-checked={Boolean(selecionada)}
      style={({ pressed }) => [
        styles.etiqueta,
        styles.interativa,
        selecionada && styles.selecionada,
        pressed && styles.pressionada,
        desabilitada && styles.desabilitada,
        estiloSemOutline,
        focado && estiloAnelFoco,
      ]}
      {...propsFoco}
    >
      <Text style={[styles.texto, selecionada && styles.textoSelecionado]}>{texto}</Text>
    </Pressable>
  );
}

const useEstilos = criarEstilos((c) => ({
  etiqueta: {
    borderRadius: Raios.capsula,
    borderCurve: 'continuous',
    paddingHorizontal: Espacamento.medio + 2,
    overflow: 'hidden',
    backgroundColor: c.preenchimento,
  },
  interativa: { minHeight: 32, justifyContent: 'center' },
  estatica: { paddingVertical: Espacamento.minimo + 1, alignSelf: 'flex-start' },
  selecionada: { backgroundColor: c.tintCheio },
  pressionada: { opacity: 0.7 },
  desabilitada: { opacity: 0.4 },
  texto: { ...Tipografia.subheadline, color: c.texto },
  textoEstatico: { ...Tipografia.footnote, color: c.texto2 },
  textoSelecionado: { color: c.sobreTint, fontWeight: '600' },
}));
