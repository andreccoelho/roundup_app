// RF04: perfil da academia — leitura, edição (EditarPerfilScreen: nome, foto, nome da academia,
// endereço, modalidades), gestão de professores, gestão de alunos, visão consolidada e sair.
// Mesma linguagem visual dos outros dois perfis: banda de identidade (marca invertida + textura
// + nome em Homebase) — aqui a identidade é a academia (nomeAcademia), não a pessoa de contato.
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Cores, Espacamento, FamiliaFonte, Sombras, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilAcademiaNavigationProp } from '../../navigation/AcademiaTabs';
import { formatarMesAno } from '../../utils/datas';
import Avatar from '../../components/ui/Avatar';
import Botao from '../../components/ui/Botao';
import Etiqueta from '../../components/ui/Etiqueta';
import TexturaLona from '../../components/ui/TexturaLona';
import ExcluirContaSecao from '../compartilhado/ExcluirContaSecao';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilAcademiaNavigationProp>();

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
        <Avatar nome={usuario?.nomeAcademia ?? usuario?.nome ?? ''} fotoUrl={usuario?.fotoUrl} tamanho={72} />
        <Text
          style={[styles.nome]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {usuario?.nomeAcademia ?? usuario?.nome}
        </Text>
        {usuario?.endereco ? <Text style={styles.detalheEscuro}>{usuario.endereco}</Text> : null}
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
          titulo="Gestão de professores"
          variante="secundario"
          onPress={() => navigation.navigate('SolicitacoesProfessores', { perfilSolicitante: 'professor' })}
        />
        <Botao
          compacto
          titulo="Gestão de alunos"
          variante="secundario"
          onPress={() => navigation.navigate('SolicitacoesAlunos', { perfilSolicitante: 'aluno' })}
        />
        <Botao compacto titulo="Visão consolidada" variante="secundario" onPress={() => navigation.navigate('VisaoConsolidada')} />
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
