// EstadoErro — ícone de alerta 64px, mensagem (já traduzida via utils/mensagensErro) e "Tentar
// novamente". `compacto` é para erro dentro de uma seção (ex.: lista do dashboard), sem ocupar a
// tela inteira.
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import { IconeAlerta } from '../icones';
import Botao from './Botao';
import Texto from './Texto';

interface EstadoErroProps {
  mensagem: string;
  onTentarNovamente: () => void;
  compacto?: boolean;
}

export default function EstadoErro({ mensagem, onTentarNovamente, compacto }: EstadoErroProps) {
  return (
    <View style={[styles.container, compacto ? styles.compacto : styles.cheio]} accessibilityRole="alert">
      <View aria-hidden importantForAccessibility="no-hide-descendants">
        <IconeAlerta tamanho={compacto ? 32 : 64} cor={Cores.perigo} espessura={compacto ? 1.6 : 1.2} />
      </View>
      <Texto variante={compacto ? 'corpo' : 'titulo'} alinhamento="center" style={styles.mensagem} cabecalho={false}>
        {mensagem}
      </Texto>
      <View style={styles.acao}>
        <Botao titulo="Tentar novamente" variante="secundario" compacto={compacto} onPress={onTentarNovamente} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  cheio: { flex: 1, padding: Espacamento.grande },
  compacto: { paddingVertical: Espacamento.grande },
  mensagem: { marginTop: Espacamento.padrao, maxWidth: 360 },
  acao: { marginTop: Espacamento.padrao, minWidth: 200 },
});
