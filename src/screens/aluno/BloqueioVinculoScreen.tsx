// RN05: aluno sem vínculo ativo cai aqui, nunca numa home vazia — o único caminho oferecido é
// a vinculação. Renderizada pelo RootNavigator antes de qualquer aba (ver navigation/AlunoRaiz.tsx).
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import Botao from '../../components/ui/Botao';
import EstadoVazio from '../../components/ui/EstadoVazio';

interface BloqueioVinculoScreenProps {
  onVincular: () => void;
  onAtualizar: () => void;
}

export default function BloqueioVinculoScreen({ onVincular, onAtualizar }: BloqueioVinculoScreenProps) {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <EstadoVazio
        titulo="Você ainda não tem vínculo ativo"
        descricao="Vincule-se a uma academia ou a um professor autônomo para ver turmas, sessões e fazer check-in."
        acaoTitulo="Vincular-se"
        onAcao={onVincular}
      />
      <View style={styles.rodape}>
        <Botao titulo="Já pedi vínculo — atualizar" variante="texto" onPress={onAtualizar} />
        <Botao titulo="Sair" variante="texto" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco, justifyContent: 'center' },
  rodape: { alignItems: 'center', gap: Espacamento.pequeno, marginTop: Espacamento.grande },
});
