// RF05: perfil do professor — leitura, edição (EditarPerfilScreen: nome, foto, graduação,
// modalidades), vínculo com academia, solicitações, pontuação, notificações, conta e privacidade, e
// sair. Mesma linguagem do Perfil do Aluno: cabeçalho centralizado, graduação e modalidades e as
// configurações em listas agrupadas. "Excluir conta" vive na subtela "Conta e privacidade".
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilProfessorNavigationProp } from '../../navigation/ProfessorTabs';
import { formatarMesAno } from '../../utils/datas';
import Tela from '../../components/ui/Tela';
import CabecalhoPerfil from '../../components/ui/CabecalhoPerfil';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Etiqueta from '../../components/ui/Etiqueta';
import GrupoLista from '../../components/ui/GrupoLista';
import LinhaLista from '../../components/ui/LinhaLista';
import ItemMenu from '../../components/ui/ItemMenu';
import { IconeCadeado, IconeCartaoPontuacao, IconeCorda, IconePerfil, IconePoste, IconeSair, IconeSino } from '../../components/icones';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilProfessorNavigationProp>();

  const modalidades = usuario?.modalidades ?? [];

  return (
    <Tela largura="lista" agrupada tituloGrande="Perfil">
      <CabecalhoPerfil
        nome={usuario?.nome ?? ''}
        fotoUrl={usuario?.fotoUrl}
        detalhes={[
          usuario?.email,
          usuario?.autonomo ? 'Atuação autônoma' : 'Vinculado a uma academia',
          usuario?.criadoEm ? `Membro desde ${formatarMesAno(usuario.criadoEm)}` : undefined,
        ]}
      />

      <GrupoLista titulo="Graduação" semMargem>
        <LinhaLista accessibilityLabel={`Graduação: ${usuario?.graduacao || 'não informada'}`}>
          <SeloFaixa faixaOuGrau={usuario?.graduacao || 'Graduação não informada'} />
        </LinhaLista>
      </GrupoLista>

      {modalidades.length > 0 ? (
        <GrupoLista titulo="Modalidades">
          <View style={styles.modalidades}>
            {modalidades.map((m) => (
              <Etiqueta key={m} texto={m} />
            ))}
          </View>
        </GrupoLista>
      ) : null}

      <GrupoLista titulo="Gestão">
        <ItemMenu rotulo="Solicitações pendentes" descricao="Pedidos de vínculo de alunos" icone={IconeCorda} onPress={() => navigation.navigate('Solicitacoes')} />
        <ItemMenu rotulo="Vincular-se a uma academia" icone={IconePoste} onPress={() => navigation.navigate('VincularProfessor')} />
        <ItemMenu
          rotulo="Pontuação e níveis"
          descricao="Pontos por check-in, por missão e tabela de níveis"
          icone={IconeCartaoPontuacao}
          onPress={() => navigation.navigate('ConfiguracaoGamificacao')}
        />
      </GrupoLista>

      <GrupoLista titulo="Conta">
        <ItemMenu rotulo="Editar perfil" icone={IconePerfil} onPress={() => navigation.navigate('EditarPerfil')} />
        <ItemMenu rotulo="Notificações" icone={IconeSino} onPress={() => navigation.navigate('PreferenciasNotificacao')} />
        <ItemMenu rotulo="Conta e privacidade" icone={IconeCadeado} onPress={() => navigation.navigate('ContaPrivacidade')} />
      </GrupoLista>

      <GrupoLista>
        <ItemMenu rotulo="Sair" icone={IconeSair} destrutivo semChevron onPress={logout} />
      </GrupoLista>
    </Tela>
  );
}

const styles = StyleSheet.create({
  modalidades: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, padding: Espacamento.padrao },
});
