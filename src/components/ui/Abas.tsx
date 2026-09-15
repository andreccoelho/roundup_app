// Abas — seletor segmentado para filtrar conteúdo dentro de uma tela (ex.: missões "em
// curso/concluídas"). Não confundir com a navegação por abas do Passo 3, que é estrutural.
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Cores, Espacamento, Raios, TamanhoFonte } from '../../theme';

interface OpcaoAba<T extends string> {
  valor: T;
  rotulo: string;
}

interface AbasProps<T extends string> {
  opcoes: OpcaoAba<T>[];
  selecionada: T;
  onSelecionar: (valor: T) => void;
}

export default function Abas<T extends string>({ opcoes, selecionada, onSelecionar }: AbasProps<T>) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {opcoes.map((opcao) => {
        const ativa = opcao.valor === selecionada;
        return (
          <TouchableOpacity
            key={opcao.valor}
            style={[styles.aba, ativa && styles.abaAtiva]}
            onPress={() => onSelecionar(opcao.valor)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            accessibilityLabel={opcao.rotulo}
          >
            <Text style={[styles.texto, ativa && styles.textoAtivo]}>{opcao.rotulo}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderWidth: 1, borderColor: Cores.cinzaEscuro, borderRadius: Raios.pilula, overflow: 'hidden' },
  aba: { flex: 1, paddingVertical: Espacamento.pequeno, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  abaAtiva: { backgroundColor: Cores.preto },
  texto: { fontSize: TamanhoFonte.sm, color: Cores.cinzaEscuro },
  textoAtivo: { color: Cores.branco, fontWeight: '600' },
});
