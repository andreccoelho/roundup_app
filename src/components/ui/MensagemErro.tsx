// MensagemErro — erro de envio de formulário/ação (ex.: "E-mail ou senha incorretos"), anunciado
// ao leitor de tela. Faixa em superficie1 com filete e ícone em perigo; o texto fica em `texto`
// (perigo sobre superfície não passa 4,5:1 — docs/DESIGN.md).
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento, Raios } from '../../theme';
import { IconeAlerta } from '../icones';
import Texto from './Texto';

export default function MensagemErro({ mensagem }: { mensagem: string | null | undefined }) {
  if (!mensagem) return null;
  return (
    <View style={styles.caixa} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <IconeAlerta tamanho={20} cor={Cores.perigo} />
      <Texto variante="subheadline" cor="texto" style={styles.texto}>
        {mensagem}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    backgroundColor: Cores.superficie1,
    borderLeftWidth: 3,
    borderLeftColor: Cores.perigo,
    borderRadius: Raios.vivo,
    paddingVertical: Espacamento.medio,
    paddingHorizontal: Espacamento.medio,
    marginBottom: Espacamento.padrao,
  },
  texto: { flex: 1 },
});
