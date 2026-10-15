// Abas — seletor segmentado dentro de uma tela (ex.: missões "em curso/concluídas", atuação
// autônomo/vinculado no cadastro). Idioma de "fight card": rótulos Oswald em caixa alta sobre uma
// linha; a aba ativa ganha sublinhado de 2px em `texto` (sem acento, que fica para o CTA da tela).
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Alturas, Cores, Espacamento, FamiliaFonte, TamanhoFonte } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';

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
  return (
    <Pressable
      style={[styles.aba, estiloSemOutline, focado && estiloAnelFoco]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}
      accessibilityLabel={rotulo}
      {...propsFoco}
    >
      <Text style={[styles.texto, ativa && styles.textoAtivo]}>{rotulo}</Text>
      <View style={[styles.marca, ativa && styles.marcaAtiva]} />
    </Pressable>
  );
}

export default function Abas<T extends string>({ opcoes, selecionada, onSelecionar, accessibilityLabel }: AbasProps<T>) {
  return (
    <View style={styles.container} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {opcoes.map((opcao) => (
        <Aba key={opcao.valor} rotulo={opcao.rotulo} ativa={opcao.valor === selecionada} onPress={() => onSelecionar(opcao.valor)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Cores.linha },
  aba: { flex: 1, minHeight: Alturas.alvoMinimo + 4, alignItems: 'center', justifyContent: 'flex-end', paddingTop: Espacamento.pequeno },
  texto: {
    fontFamily: FamiliaFonte.placarSemiBold,
    fontSize: TamanhoFonte.sm,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Cores.texto3,
    paddingBottom: Espacamento.pequeno + 2,
  },
  textoAtivo: { color: Cores.texto },
  marca: { alignSelf: 'stretch', height: 2, marginBottom: -1, backgroundColor: 'transparent' },
  marcaAtiva: { backgroundColor: Cores.texto },
});
