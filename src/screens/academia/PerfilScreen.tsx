// RF04: perfil da academia. Hoje só leitura + gestão de professores + visão consolidada + sair;
// edição chega no Passo 4.
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilAcademiaNavigationProp } from '../../navigation/AcademiaTabs';
import Botao from '../../components/ui/Botao';
import EstadoVazio from '../../components/ui/EstadoVazio';
import ExcluirContaSecao from '../compartilhado/ExcluirContaSecao';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilAcademiaNavigationProp>();

  const modalidades = usuario?.modalidades?.join(', ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.nome}>{usuario?.nomeAcademia ?? usuario?.nome}</Text>
      {usuario?.endereco ? <Text style={styles.detalhe}>{usuario.endereco}</Text> : null}
      {modalidades ? <Text style={styles.detalhe}>{modalidades}</Text> : null}
      <Text style={styles.email}>{usuario?.email}</Text>

      <View style={styles.secao}>
        <Botao titulo="Gestão de professores" variante="secundario" onPress={() => navigation.navigate('Solicitacoes')} />
      </View>
      <View style={styles.secaoPequena}>
        <Botao titulo="Visão consolidada" variante="secundario" onPress={() => navigation.navigate('VisaoConsolidada')} />
      </View>
      <View style={styles.secaoPequena}>
        <Botao
          titulo="Preferências de notificação"
          variante="secundario"
          onPress={() => navigation.navigate('PreferenciasNotificacao')}
        />
      </View>

      <View style={styles.secao}>
        <EstadoVazio titulo="Edição de perfil" descricao="Editar dados da academia chega no Passo 4." />
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
