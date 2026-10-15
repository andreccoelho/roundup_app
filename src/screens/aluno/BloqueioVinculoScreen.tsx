// RN05: aluno sem vínculo ativo cai aqui, nunca numa home vazia — o único caminho oferecido é
// a vinculação. Renderizada pelo RootNavigator antes de qualquer aba (ver navigation/AlunoRaiz.tsx).
// Visual: tela cheia escura com a marca, título display e o CTA "Vincular-se" em acento.
import { Image, StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import Botao from '../../components/ui/Botao';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';

interface BloqueioVinculoScreenProps {
  onVincular: () => void;
  onAtualizar: () => void;
}

export default function BloqueioVinculoScreen({ onVincular, onAtualizar }: BloqueioVinculoScreenProps) {
  const { logout } = useAuth();
  return (
    <Tela largura="formulario" bordas={['topo', 'base']} centralizarVertical>
      <View style={styles.marca}>
        <Image
          source={require('../../../assets/roundup_logo_invertida.png')}
          style={styles.logo}
          resizeMode="contain"
          accessible={false}
          aria-hidden
        />
      </View>
      <Texto variante="rotuloPlacar" alinhamento="center">
        Antes do primeiro round
      </Texto>
      <Texto variante="display" alinhamento="center" style={styles.titulo}>
        Escolha seu corner
      </Texto>
      <Texto variante="corpo" cor="texto2" alinhamento="center" style={styles.descricao}>
        Vincule-se a uma academia ou a um professor autônomo para ver turmas, sessões e fazer check-in.
      </Texto>

      <Botao titulo="Vincular-se" grande onPress={onVincular} />
      <View style={styles.rodape}>
        <Botao titulo="Já pedi vínculo, atualizar" variante="texto" onPress={onAtualizar} />
        <Botao titulo="Sair" variante="texto" onPress={logout} />
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  marca: { alignItems: 'center', marginBottom: Espacamento.grande },
  logo: { width: 160, height: 160, marginVertical: -30 },
  titulo: { marginTop: Espacamento.pequeno },
  descricao: { marginTop: Espacamento.pequeno, marginBottom: Espacamento.grande },
  rodape: { alignItems: 'center', gap: Espacamento.minimo, marginTop: Espacamento.padrao },
});
