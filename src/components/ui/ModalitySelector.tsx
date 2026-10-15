// RF04, RF05, RF06: seletor de modalidade(s) compartilhado pelos 3 cadastros — pílulas que
// preenchem de preto quando ativas, não o "kit de card branco com borda" repetido na tela.
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Cores } from '../../theme';
import { TamanhoFonte } from '../../theme';
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
          placeholderTextColor={Cores.texto3}
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
  rotulo: { fontSize: TamanhoFonte.sm, color: Cores.texto2, marginBottom: 10 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pilula: {
    borderWidth: 1,
    borderColor: Cores.linhaForte,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pilulaAtiva: { backgroundColor: Cores.superficie2, borderColor: Cores.texto },
  textoPilula: { fontSize: TamanhoFonte.sm, color: Cores.linhaForte },
  textoPilulaAtiva: { color: Cores.texto, fontWeight: '600' },
  campoOutra: {
    borderBottomWidth: 1,
    borderBottomColor: Cores.linha,
    paddingVertical: 8,
    marginTop: 12,
    fontSize: TamanhoFonte.md,
    color: Cores.texto,
  },
  erro: { fontSize: TamanhoFonte.xs, color: Cores.perigo, marginTop: 6 },
});
