// RF05: perfil do professor — leitura, edição (EditarPerfilScreen: nome, foto, graduação,
// modalidades), vínculo com academia, solicitações, notificações, conta e privacidade, e sair.
// Mesma linguagem do Perfil do Aluno: banda de identidade (gestor), card de faixa (único corte
// diagonal da tela), modalidades e configurações como lista de ItemMenu. "Excluir conta" vive na
// subtela "Conta e privacidade".
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilProfessorNavigationProp } from '../../navigation/ProfessorTabs';
import { formatarMesAno } from '../../utils/datas';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import BandaIdentidade from '../../components/ui/BandaIdentidade';
import Cartao from '../../components/ui/Cartao';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Etiqueta from '../../components/ui/Etiqueta';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import ItemMenu from '../../components/ui/ItemMenu';
import { IconeCadeado, IconeCartaoPontuacao, IconeCorda, IconePerfil, IconePoste, IconeSair, IconeSino } from '../../components/icones';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilProfessorNavigationProp>();

  const modalidades = usuario?.modalidades ?? [];
  const detalhes = [
    usuario?.autonomo ? 'Atuação autônoma' : 'Vinculado a uma academia',
    usuario?.email,
    usuario?.criadoEm ? `Membro desde ${formatarMesAno(usuario.criadoEm)}` : undefined,
  ].filter((d): d is string => Boolean(d));

  return (
    <Tela largura="lista" preenchimento={false}>
      <BandaIdentidade variante="gestor" sobHeader nome={usuario?.nome ?? ''} fotoUrl={usuario?.fotoUrl} detalhes={detalhes} />

      <View style={styles.corpo}>
        <Cartao corteDiagonal>
          <Texto variante="rotuloPlacar" alinhamento="center">
            Graduação
          </Texto>
          <View style={styles.faixa}>
            <SeloFaixa faixaOuGrau={usuario?.graduacao || 'Graduação não informada'} tamanho="grande" />
          </View>
        </Cartao>

        {modalidades.length > 0 ? (
          <>
            <CabecalhoSecao titulo="Modalidades" />
            <View style={styles.modalidades}>
              {modalidades.map((m) => (
                <Etiqueta key={m} texto={m} />
              ))}
            </View>
          </>
        ) : null}

        <CabecalhoSecao titulo="Gestão" />
        <ItemMenu rotulo="Solicitações pendentes" descricao="Pedidos de vínculo de alunos" icone={IconeCorda} onPress={() => navigation.navigate('Solicitacoes')} />
        <ItemMenu rotulo="Vincular-se a uma academia" icone={IconePoste} onPress={() => navigation.navigate('VincularProfessor')} separador />
        <ItemMenu
          rotulo="Pontuação e níveis"
          descricao="Pontos por check-in, por missão e tabela de níveis"
          icone={IconeCartaoPontuacao}
          onPress={() => navigation.navigate('ConfiguracaoGamificacao')}
          separador
        />

        <CabecalhoSecao titulo="Conta" />
        <ItemMenu rotulo="Editar perfil" icone={IconePerfil} onPress={() => navigation.navigate('EditarPerfil')} />
        <ItemMenu rotulo="Notificações" icone={IconeSino} onPress={() => navigation.navigate('PreferenciasNotificacao')} separador />
        <ItemMenu rotulo="Conta e privacidade" icone={IconeCadeado} onPress={() => navigation.navigate('ContaPrivacidade')} separador />
        <ItemMenu rotulo="Sair" icone={IconeSair} semChevron onPress={logout} separador />
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  corpo: { paddingHorizontal: Espacamento.padrao, paddingTop: Espacamento.grande, paddingBottom: Espacamento.enorme },
  faixa: { marginTop: Espacamento.padrao, marginBottom: Espacamento.pequeno },
  modalidades: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno },
});
