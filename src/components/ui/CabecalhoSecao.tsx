// CabecalhoSecao — título de bloco de conteúdo (Title 3), como "Tendências" no Fitness ou
// "Destaques" no Saúde, com contador e/ou ação em tint ("Ver tudo") à direita. Listas de
// configuração usam o cabeçalho do próprio GrupoLista (Footnote); `formulario` dá esse mesmo
// cabeçalho pequeno para seções de formulário soltas (cadastro), sem lista em volta.
import { View } from 'react-native';
import { criarEstilos, Espacamento } from '../../theme';
import Botao from './Botao';
import Texto from './Texto';

interface CabecalhoSecaoProps {
  titulo: string;
  contador?: string | number;
  acaoTitulo?: string;
  onAcao?: () => void;
  // Sem margem superior (primeira seção logo abaixo de um bloco que já tem respiro).
  semMargem?: boolean;
  formulario?: boolean;
}

export default function CabecalhoSecao({ titulo, contador, acaoTitulo, onAcao, semMargem, formulario }: CabecalhoSecaoProps) {
  const styles = useEstilos();
  if (formulario) {
    return (
      <Texto variante="footnote" cabecalho style={[styles.formulario, !semMargem && styles.margemFormulario]}>
        {titulo}
      </Texto>
    );
  }
  return (
    <View style={[styles.linha, !semMargem && styles.margem]}>
      <Texto variante="title3" style={styles.titulo}>
        {titulo}
      </Texto>
      {contador !== undefined ? <Texto variante="subheadline">{String(contador)}</Texto> : null}
      {acaoTitulo && onAcao ? <Botao variante="texto" titulo={acaoTitulo} onPress={onAcao} /> : null}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.pequeno, minHeight: 32, marginBottom: Espacamento.pequeno },
  margem: { marginTop: Espacamento.grande },
  titulo: { flex: 1 },
  formulario: { marginLeft: Espacamento.minimo, marginBottom: Espacamento.pequeno },
  margemFormulario: { marginTop: Espacamento.grande },
}));
