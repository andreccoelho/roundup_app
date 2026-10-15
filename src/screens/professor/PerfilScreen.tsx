// RF05: perfil do professor — leitura, edição (EditarPerfilScreen: nome, foto, graduação,
// modalidades), vínculo com academia e sair.
// Mesma linguagem visual do Perfil do Aluno: banda de identidade (marca invertida + textura +
// nome em Homebase), SeloFaixa pra graduação, modalidades em chips.
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Cores, Espacamento, FamiliaFonte, Sombras, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilProfessorNavigationProp } from '../../navigation/ProfessorTabs';
import { formatarMesAno } from '../../utils/datas';
import Avatar from '../../components/ui/Avatar';
import Botao from '../../components/ui/Botao';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Etiqueta from '../../components/ui/Etiqueta';
import TexturaLona from '../../components/ui/TexturaLona';
import ExcluirContaSecao from '../compartilhado/ExcluirContaSecao';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilProfessorNavigationProp>();

  const modalidades = usuario?.modalidades ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.cabecalho}>
        <TexturaLona opacidade={0.08} cor={Cores.texto} />
        <Image
          source={require('../../../assets/roundup_logo_invertida.png')}
          style={styles.marcaFundo}
          resizeMode="contain"
        />
        <Avatar nome={usuario?.nome ?? ''} fotoUrl={usuario?.fotoUrl} tamanho={72} />
        <Text style={[styles.nome]} numberOfLines={1} adjustsFontSizeToFit>
          {usuario?.nome ?? ''}
        </Text>
        {usuario?.graduacao ? (
          <View style={styles.seloLinha}>
            <SeloFaixa faixaOuGrau={usuario.graduacao} sobreEscuro />
          </View>
        ) : (
          <Text style={styles.detalheEscuro}>Graduação não informada</Text>
        )}
        <Text style={styles.detalheEscuro}>{usuario?.autonomo ? 'Atuação autônoma' : 'Vinculado a uma academia'}</Text>
        {usuario?.criadoEm ? <Text style={styles.membroDesde}>Membro desde {formatarMesAno(usuario.criadoEm)}</Text> : null}
      </View>

      {modalidades.length > 0 ? (
        <View style={styles.modalidadesLinha}>
          {modalidades.map((modalidade) => (
            <Etiqueta key={modalidade} texto={modalidade} />
          ))}
        </View>
      ) : null}

      <Text style={styles.email}>{usuario?.email}</Text>

      <View style={styles.botoesLinha}>
        <Botao compacto titulo="Editar perfil" variante="secundario" onPress={() => navigation.navigate('EditarPerfil')} />
        <Botao
          compacto
          titulo="Vincular-se a uma academia"
          variante="secundario"
          onPress={() => navigation.navigate('VincularProfessor')}
        />
        <Botao compacto titulo="Solicitações pendentes" variante="secundario" onPress={() => navigation.navigate('Solicitacoes')} />
        <Botao
          compacto
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
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { paddingBottom: Espacamento.enorme },

  cabecalho: {
    backgroundColor: Cores.superficie2,
    alignItems: 'center',
    paddingTop: Espacamento.extraGrande,
    paddingBottom: Espacamento.grande,
    paddingHorizontal: Espacamento.grande,
    overflow: 'hidden',
  },
  marcaFundo: { position: 'absolute', top: -30, right: -60, width: 180, height: 180, opacity: 0.12 },
  nome: {
    fontFamily: FamiliaFonte.display,
    fontSize: TamanhoFonte.xxl,
    color: Cores.texto,
    letterSpacing: 1,
    marginTop: Espacamento.medio,
    maxWidth: '100%',
  },
  seloLinha: { marginTop: Espacamento.pequeno },
  detalheEscuro: { fontSize: TamanhoFonte.sm, color: Cores.texto3, marginTop: Espacamento.pequeno },
  membroDesde: { fontSize: TamanhoFonte.xs, color: Cores.texto3, marginTop: Espacamento.pequeno, textTransform: 'capitalize' },

  modalidadesLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.pequeno,
    paddingHorizontal: Espacamento.padrao,
    paddingTop: Espacamento.padrao,
  },
  email: { fontSize: TamanhoFonte.sm, color: Cores.texto2, paddingHorizontal: Espacamento.padrao, marginTop: Espacamento.pequeno },

  botoesLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.pequeno,
    paddingHorizontal: Espacamento.padrao,
    marginTop: Espacamento.padrao,
  },
  rodape: { alignItems: 'center', marginTop: Espacamento.grande },
});
