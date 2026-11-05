// RN05: aluno sem vínculo ativo cai aqui, nunca numa home vazia — o único caminho oferecido é
// a vinculação. Renderizada pelo RootNavigator antes de qualquer aba (ver navigation/AlunoRaiz.tsx).
// Visual: o padrão de "conteúdo indisponível" do iOS — logo, título, uma linha de explicação e o
// botão cheio "Vincular-se"; ações secundárias como links em tint.
import { StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import Botao from '../../components/ui/Botao';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Logo from '../../components/Logo';

interface BloqueioVinculoScreenProps {
  onVincular: () => void;
  onAtualizar: () => void;
}

export default function BloqueioVinculoScreen({ onVincular, onAtualizar }: BloqueioVinculoScreenProps) {
  const { logout } = useAuth();
  return (
    <Tela largura="formulario" bordas={['topo', 'base']} centralizarVertical agrupada>
      <View style={styles.marca}>
        <Logo tamanho={120} style={styles.logo} />
      </View>
      <Texto variante="title1" alinhamento="center">
        Escolha seu corner
      </Texto>
      <Texto variante="body" cor="texto2" alinhamento="center" style={styles.descricao}>
        Vincule-se a uma academia ou a um professor autônomo para ver turmas, sessões e fazer check-in.
      </Texto>

      <Botao titulo="Vincular-se" onPress={onVincular} />
      <View style={styles.rodape}>
        <Botao titulo="Já pedi vínculo, atualizar" variante="texto" onPress={onAtualizar} />
        <Botao titulo="Sair" variante="texto" onPress={logout} />
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  marca: { alignItems: 'center', marginBottom: Espacamento.padrao },
  logo: { marginVertical: -20 },
  descricao: { marginTop: Espacamento.pequeno, marginBottom: Espacamento.grande },
  rodape: { alignItems: 'center', gap: Espacamento.minimo, marginTop: Espacamento.padrao },
});
