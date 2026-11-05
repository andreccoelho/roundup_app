// EstadoErro — mesmo padrão do EstadoVazio: ícone de alerta em texto3, mensagem (já traduzida via
// utils/mensagensErro) em Title 3 e "Tentar novamente". `compacto` é para erro dentro de uma
// seção (ex.: lista do dashboard), sem ocupar a tela inteira.
import { View } from 'react-native';
import { criarEstilos, Espacamento, useTema } from '../../theme';
import { IconeAlerta } from '../icones';
import Botao from './Botao';
import Texto from './Texto';

interface EstadoErroProps {
  mensagem: string;
  onTentarNovamente: () => void;
  compacto?: boolean;
}

export default function EstadoErro({ mensagem, onTentarNovamente, compacto }: EstadoErroProps) {
  const styles = useEstilos();
  const { cores } = useTema();
  return (
    <View style={[styles.container, compacto ? styles.compacto : styles.cheio]} accessibilityRole="alert">
      <View aria-hidden importantForAccessibility="no-hide-descendants">
        <IconeAlerta tamanho={compacto ? 32 : 56} cor={cores.texto3} espessura={1.6} />
      </View>
      <Texto variante={compacto ? 'body' : 'title3'} alinhamento="center" style={styles.mensagem} cabecalho={false}>
        {mensagem}
      </Texto>
      <View style={styles.acao}>
        <Botao titulo="Tentar novamente" variante="secundario" compacto onPress={onTentarNovamente} />
      </View>
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  container: { alignItems: 'center', justifyContent: 'center' },
  cheio: { flex: 1, padding: Espacamento.grande, backgroundColor: c.fundoAgrupado },
  compacto: { paddingVertical: Espacamento.grande },
  mensagem: { marginTop: Espacamento.padrao, maxWidth: 320 },
  acao: { marginTop: Espacamento.padrao, alignItems: 'center' },
}));
