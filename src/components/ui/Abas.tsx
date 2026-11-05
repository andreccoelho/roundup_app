// Abas — controle segmentado do iOS (UISegmentedControl) dentro de uma tela: trilho em
// `preenchimento`, segmento ativo destacado (branco no claro, cinza no escuro) e haptic de seleção
// ao trocar. Semântica de tabs (tablist/tab + aria-selected) para leitor de tela.
import { Pressable, Text, View } from 'react-native';
import { Alturas, criarEstilos, Espacamento, Tipografia } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import { hapticaSelecao } from '../../utils/haptica';

interface OpcaoAba<T extends string> {
  valor: T;
  rotulo: string;
}

interface AbasProps<T extends string> {
  opcoes: OpcaoAba<T>[];
  selecionada: T;
  onSelecionar: (valor: T) => void;
  accessibilityLabel?: string;
}

function Aba({ rotulo, ativa, onPress }: { rotulo: string; ativa: boolean; onPress: () => void }) {
  const { focado, propsFoco } = useFocoVisivel();
  const styles = useEstilos();
  return (
    <Pressable
      style={[styles.aba, ativa && styles.abaAtiva, estiloSemOutline, focado && estiloAnelFoco]}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}
      aria-selected={ativa}
      accessibilityLabel={rotulo}
      {...propsFoco}
    >
      <Text style={[styles.texto, ativa && styles.textoAtivo]} numberOfLines={1}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

export default function Abas<T extends string>({ opcoes, selecionada, onSelecionar, accessibilityLabel }: AbasProps<T>) {
  const styles = useEstilos();
  return (
    <View style={styles.trilho} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {opcoes.map((opcao) => (
        <Aba
          key={opcao.valor}
          rotulo={opcao.rotulo}
          ativa={opcao.valor === selecionada}
          onPress={() => {
            if (opcao.valor !== selecionada) hapticaSelecao();
            onSelecionar(opcao.valor);
          }}
        />
      ))}
    </View>
  );
}

const useEstilos = criarEstilos((c, escuro) => ({
  trilho: { flexDirection: 'row', backgroundColor: c.preenchimento, borderRadius: 9, borderCurve: 'continuous', padding: 2 },
  aba: {
    flex: 1,
    minHeight: Alturas.alvoMinimo - 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    borderCurve: 'continuous',
    paddingHorizontal: Espacamento.pequeno,
  },
  abaAtiva: {
    backgroundColor: c.controleSelecionado,
    ...(escuro ? {} : { boxShadow: '0px 3px 8px rgba(0,0,0,0.12), 0px 1px 1px rgba(0,0,0,0.04)' }),
  },
  texto: { ...Tipografia.footnote, fontWeight: '500', color: c.texto },
  textoAtivo: { fontWeight: '600' },
}));
