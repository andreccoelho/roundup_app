// EstadoVazio — convite à ação, não lamento (ver DESIGN_BRIEF.md / SCRIPT.md, Passo 4).
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import Botao from './Botao';

interface EstadoVazioProps {
  titulo: string;
  descricao?: string;
  acaoTitulo?: string;
  onAcao?: () => void;
}

export default function EstadoVazio({ titulo, descricao, acaoTitulo, onAcao }: EstadoVazioProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>
      {descricao ? <Text style={styles.descricao}>{descricao}</Text> : null}
      {acaoTitulo && onAcao ? (
        <>
          <View style={styles.espaco} />
          <Botao titulo={acaoTitulo} variante="secundario" onPress={onAcao} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: Espacamento.grande },
  titulo: { color: Cores.preto, fontSize: TamanhoFonte.md, fontWeight: '600', textAlign: 'center' },
  descricao: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm, textAlign: 'center', marginTop: Espacamento.minimo },
  espaco: { height: Espacamento.padrao },
});
