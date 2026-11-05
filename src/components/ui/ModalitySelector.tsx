// RF04, RF05, RF06: seletor de modalidade(s) compartilhado pelos 3 cadastros e pela edição de
// perfil. Visual 100% da Etiqueta (modo múltiplo) + CampoTexto para "Outra" — sem estilo próprio.
import { StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
import { MODALIDADES, MODALIDADE_OUTRA } from '../../constants/modalidades';
import Etiqueta from './Etiqueta';
import CampoTexto from './CampoTexto';
import Texto from './Texto';

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
    <View style={styles.container} role="group" aria-label={rotulo}>
      <Texto variante="subheadline" style={styles.rotulo} cabecalho={false}>
        {rotulo}
      </Texto>
      <View style={styles.grade}>
        {[...MODALIDADES, MODALIDADE_OUTRA].map((modalidade) => (
          <Etiqueta
            key={modalidade}
            texto={modalidade}
            modo="multiplo"
            selecionada={selecionadas.includes(modalidade)}
            onPress={() => alternar(modalidade)}
          />
        ))}
      </View>
      {outraSelecionada ? (
        <View style={styles.outra}>
          <CampoTexto rotulo="Qual modalidade?" valor={outraTexto} onAlterar={onAlterarOutraTexto} />
        </View>
      ) : null}
      {erro ? (
        <Texto variante="subheadline" cor="perigo" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Espacamento.padrao },
  rotulo: { marginBottom: Espacamento.pequeno },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno },
  outra: { marginTop: Espacamento.medio },
});
