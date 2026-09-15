// RF05: perfil do professor. Hoje só leitura + vínculo com academia + sair; edição chega no
// Passo 4.
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilProfessorNavigationProp } from '../../navigation/ProfessorTabs';
import Botao from '../../components/ui/Botao';
import EstadoVazio from '../../components/ui/EstadoVazio';
import ExcluirContaSecao from '../compartilhado/ExcluirContaSecao';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilProfessorNavigationProp>();

  const modalidades = usuario?.modalidades?.join(', ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.nome}>{usuario?.nome}</Text>
      <Text style={styles.detalhe}>
        {usuario?.graduacao ?? 'Graduação não informada'}
        {modalidades ? ` · ${modalidades}` : ''}
      </Text>
      <Text style={styles.detalhe}>{usuario?.autonomo ? 'Atuação autônoma' : 'Vinculado a uma academia'}</Text>
      <Text style={styles.email}>{usuario?.email}</Text>

      <View style={styles.secao}>
        <Botao
          titulo="Vincular-se a uma academia"
          variante="secundario"
          onPress={() => navigation.navigate('VincularProfessor')}
        />
      </View>
      <View style={styles.secaoPequena}>
        <Botao titulo="Solicitações pendentes" variante="secundario" onPress={() => navigation.navigate('Solicitacoes')} />
      </View>

      <View style={styles.secao}>
        <EstadoVazio titulo="Edição de perfil" descricao="Editar modalidades e graduação chega no Passo 4." />
      </View>

      <ExcluirContaSecao />

      <View style={styles.rodape}>
        <Botao titulo="Sair" variante="texto" onPress={logout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco },
  conteudo: { padding: Espacamento.padrao, paddingBottom: Espacamento.enorme },
  nome: { fontSize: TamanhoFonte.xl, fontWeight: '700', color: Cores.preto },
  detalhe: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
  email: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: 2 },
  secao: { marginTop: Espacamento.grande },
  secaoPequena: { marginTop: Espacamento.pequeno },
  rodape: { alignItems: 'center', marginTop: Espacamento.grande },
});
