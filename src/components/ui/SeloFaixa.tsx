// SeloFaixa — faixa/grau em destaque (RF06, RF25). O dado (Usuario.faixaOuGrau) já existe;
// hoje só aparece como texto simples em aluno/DashboardScreen.tsx, sem tratamento visual
// próprio — fora do escopo desta consolidação tocar nas telas do Ciclo 1 além do já pedido.
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, Raios, TamanhoFonte } from '../../theme';

interface SeloFaixaProps {
  faixaOuGrau: string;
  // Selo padrão pressupõe fundo claro (pílula preta). Sobre uma superfície já preta (ex.: banda
  // de topo do Dashboard do Aluno), a pílula preta some — vira contorno branco vazado.
  sobreEscuro?: boolean;
}

export default function SeloFaixa({ faixaOuGrau, sobreEscuro }: SeloFaixaProps) {
  return (
    <View
      style={[styles.selo, sobreEscuro && styles.seloSobreEscuro]}
      accessibilityLabel={`Faixa: ${faixaOuGrau}`}
    >
      <Text style={styles.texto}>{faixaOuGrau}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: {
    alignSelf: 'flex-start',
    backgroundColor: Cores.preto,
    borderRadius: Raios.pilula,
    paddingVertical: Espacamento.minimo,
    paddingHorizontal: Espacamento.medio,
  },
  seloSobreEscuro: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Cores.branco,
  },
  texto: { color: Cores.branco, fontSize: TamanhoFonte.sm, fontWeight: '600' },
});
