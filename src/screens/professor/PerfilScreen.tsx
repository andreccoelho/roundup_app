// RF05: perfil do professor — leitura, edição (EditarPerfilScreen: nome, foto, graduação,
// modalidades), vínculo com academia e sair.
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilProfessorNavigationProp } from '../../navigation/ProfessorTabs';
import Avatar from '../../components/ui/Avatar';
import Botao from '../../components/ui/Botao';
import SeloFaixa from '../../components/ui/SeloFaixa';
import ExcluirContaSecao from '../compartilhado/ExcluirContaSecao';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilProfessorNavigationProp>();

  const modalidades = usuario?.modalidades?.join(', ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.cabecalho}>
        <Avatar nome={usuario?.nome ?? ''} fotoUrl={usuario?.fotoUrl} tamanho={64} />
        <View style={styles.cabecalhoTextos}>
          <Text style={styles.nome}>{usuario?.nome}</Text>
          {/* script.md, item 4: badge de graduação real, não texto solto — mesmo tratamento do
              Perfil do Aluno. */}
          {usuario?.graduacao ? (
            <View style={styles.seloLinha}>
              <SeloFaixa faixaOuGrau={usuario.graduacao} />
            </View>
          ) : (
            <Text style={styles.detalhe}>Graduação não informada</Text>
          )}
          {modalidades ? <Text style={styles.detalhe}>{modalidades}</Text> : null}
          <Text style={styles.detalhe}>{usuario?.autonomo ? 'Atuação autônoma' : 'Vinculado a uma academia'}</Text>
          <Text style={styles.email}>{usuario?.email}</Text>
        </View>
      </View>

      <View style={styles.secaoPequena}>
        <Botao titulo="Editar perfil" variante="secundario" onPress={() => navigation.navigate('EditarPerfil')} />
      </View>
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
      <View style={styles.secaoPequena}>
        <Botao
          titulo="Preferências de notificação"
          variante="secundario"
          onPress={() => navigation.navigate('PreferenciasNotificacao')}
        />
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
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.padrao },
  cabecalhoTextos: { flex: 1 },
  nome: { fontSize: TamanhoFonte.xl, fontWeight: '700', color: Cores.preto },
  seloLinha: { marginTop: Espacamento.minimo },
  detalhe: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
  email: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: 2 },
  secao: { marginTop: Espacamento.grande },
  secaoPequena: { marginTop: Espacamento.pequeno },
  rodape: { alignItems: 'center', marginTop: Espacamento.grande },
});
