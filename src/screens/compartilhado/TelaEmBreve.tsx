// Shell de navegação para abas cujo conteúdo depende de dados ainda bloqueados em
// firestore.rules (Ciclo 2/3) ou de trabalho de tela ainda não feito (Passo 4). Existe para que
// a navegação fique completa e testável sem esperar o backend — nunca aba oculta, nunca tela
// em branco (ver SCRIPT.md, Passo 3).
import { StyleSheet, View } from 'react-native';
import { Cores } from '../../theme';
import EstadoVazio from '../../components/ui/EstadoVazio';

interface TelaEmBreveProps {
  titulo: string;
  descricao: string;
}

export default function TelaEmBreve({ titulo, descricao }: TelaEmBreveProps) {
  return (
    <View style={styles.container}>
      <EstadoVazio titulo={titulo} descricao={descricao} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo, justifyContent: 'center' },
});
