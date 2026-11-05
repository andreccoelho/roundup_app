// MensagemErro — erro de envio de formulário/ação (ex.: "E-mail ou senha incorretos"), anunciado
// ao leitor de tela, com haptic de aviso quando aparece. Bloco arredondado em tintSuave com ícone
// em perigo; o texto fica em `texto`, que passa 4,5:1 sobre o fundo suave nos dois temas.
import { useEffect } from 'react';
import { View } from 'react-native';
import { criarEstilos, Espacamento, Raios, useTema } from '../../theme';
import { hapticaAviso } from '../../utils/haptica';
import { IconeAlerta } from '../icones';
import Texto from './Texto';

export default function MensagemErro({ mensagem }: { mensagem: string | null | undefined }) {
  const styles = useEstilos();
  const { cores } = useTema();

  useEffect(() => {
    if (mensagem) hapticaAviso();
  }, [mensagem]);

  if (!mensagem) return null;
  return (
    <View style={styles.caixa} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <IconeAlerta tamanho={20} cor={cores.perigo} />
      <Texto variante="subheadline" cor="texto" style={styles.texto}>
        {mensagem}
      </Texto>
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    backgroundColor: c.tintSuave,
    borderRadius: Raios.lista,
    borderCurve: 'continuous',
    paddingVertical: Espacamento.medio,
    paddingHorizontal: Espacamento.medio,
    marginBottom: Espacamento.padrao,
  },
  texto: { flex: 1 },
}));
