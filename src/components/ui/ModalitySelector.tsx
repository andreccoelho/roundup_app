// RF04, RF05, RF06: seletor de modalidade(s) compartilhado pelos 3 cadastros — pílulas que
// preenchem de preto quando ativas, não o "kit de card branco com borda" repetido na tela.
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { MODALIDADES, MODALIDADE_OUTRA } from '../../constants/modalidades';

const semAnelDeFoco = { outlineWidth: 0 } as const;

interface ModalitySelectorProps {
  rotulo: string;
  selecionadas: string[];
  outraTexto: string;
  onAlterarSelecionadas: (modalidades: string[]) => void;
  onAlterarOutraTexto: (texto: string) => void;
  erro?: string;
}

export default function ModalitySelector({
  rotulo,
  selecionadas,
  outraTexto,
  onAlterarSelecionadas,
  onAlterarOutraTexto,
  erro,
}: ModalitySelectorProps) {
  const outraSelecionada = selecionadas.includes(MODALIDADE_OUTRA);

  function alternar(modalidade: string) {
    if (selecionadas.includes(modalidade)) {
      onAlterarSelecionadas(selecionadas.filter((m) => m !== modalidade));
    } else {
      onAlterarSelecionadas([...selecionadas, modalidade]);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <View style={styles.grade}>
        {MODALIDADES.map((modalidade) => {
          const ativa = selecionadas.includes(modalidade);
          return (
            <TouchableOpacity
              key={modalidade}
              style={[styles.pilula, ativa && styles.pilulaAtiva, semAnelDeFoco]}
              onPress={() => alternar(modalidade)}
            >
              <Text style={[styles.textoPilula, ativa && styles.textoPilulaAtiva]}>{modalidade}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.pilula, outraSelecionada && styles.pilulaAtiva, semAnelDeFoco]}
          onPress={() => alternar(MODALIDADE_OUTRA)}
        >
          <Text style={[styles.textoPilula, outraSelecionada && styles.textoPilulaAtiva]}>{MODALIDADE_OUTRA}</Text>
        </TouchableOpacity>
      </View>
      {outraSelecionada ? (
        <TextInput
          style={[styles.campoOutra, semAnelDeFoco]}
          placeholder="Qual modalidade?"
          placeholderTextColor={Colors.cinzaClaro}
          value={outraTexto}
          onChangeText={onAlterarOutraTexto}
        />
      ) : null}
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  rotulo: { fontSize: FontSize.sm, color: Colors.cinzaMedio, marginBottom: 10 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pilula: {
    borderWidth: 1,
    borderColor: Colors.cinzaEscuro,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pilulaAtiva: { backgroundColor: Colors.preto, borderColor: Colors.preto },
  textoPilula: { fontSize: FontSize.sm, color: Colors.cinzaEscuro },
  textoPilulaAtiva: { color: Colors.branco, fontWeight: '600' },
  campoOutra: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.cinzaBorda,
    paddingVertical: 8,
    marginTop: 12,
    fontSize: FontSize.md,
    color: Colors.preto,
  },
  erro: { fontSize: FontSize.xs, color: Colors.alerta, marginTop: 6 },
});
