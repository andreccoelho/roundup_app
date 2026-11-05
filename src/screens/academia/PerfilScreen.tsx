// RF04: perfil da academia — leitura, edição (EditarPerfilScreen: nome, foto, nome da academia,
// endereço, modalidades), gestão de professores, gestão de alunos, visão consolidada, pontuação,
// notificações, conta e privacidade, e sair. A identidade do cabeçalho é a academia (nomeAcademia),
// não a pessoa de contato. "Excluir conta" vive na subtela "Conta e privacidade".
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilAcademiaNavigationProp } from '../../navigation/AcademiaTabs';
import { formatarMesAno } from '../../utils/datas';
import Tela from '../../components/ui/Tela';
import CabecalhoPerfil from '../../components/ui/CabecalhoPerfil';
import Etiqueta from '../../components/ui/Etiqueta';
import GrupoLista from '../../components/ui/GrupoLista';
import ItemMenu from '../../components/ui/ItemMenu';
import {
  IconeCadeado,
  IconeCartaoPontuacao,
  IconeFaixa,
  IconeLuva,
  IconePerfil,
  IconeSair,
  IconeSino,
} from '../../components/icones';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilAcademiaNavigationProp>();

  const modalidades = usuario?.modalidades ?? [];

  return (
    <Tela largura="lista" agrupada tituloGrande="Perfil">
      <CabecalhoPerfil
        nome={usuario?.nomeAcademia ?? usuario?.nome ?? ''}
        fotoUrl={usuario?.fotoUrl}
        detalhes={[
          usuario?.endereco,
          usuario?.nome ? `Responsável: ${usuario.nome}` : undefined,
          usuario?.criadoEm ? `Membro desde ${formatarMesAno(usuario.criadoEm)}` : undefined,
        ]}
      />

      {modalidades.length > 0 ? (
        <GrupoLista titulo="Modalidades" semMargem>
          <View style={styles.modalidades}>
            {modalidades.map((m) => (
              <Etiqueta key={m} texto={m} />
            ))}
          </View>
        </GrupoLista>
      ) : null}

      <GrupoLista titulo="Gestão" semMargem={modalidades.length === 0}>
        <ItemMenu
          rotulo="Gestão de professores"
          descricao="Pedidos e professores vinculados"
          icone={IconeLuva}
          onPress={() => navigation.navigate('SolicitacoesProfessores', { perfilSolicitante: 'professor' })}
        />
        <ItemMenu
          rotulo="Gestão de alunos"
          descricao="Pedidos e alunos vinculados"
          icone={IconeFaixa}
          onPress={() => navigation.navigate('SolicitacoesAlunos', { perfilSolicitante: 'aluno' })}
        />
        <ItemMenu
          rotulo="Visão consolidada"
          descricao="Turmas, equipe e frequência da unidade"
          icone={IconeCartaoPontuacao}
          onPress={() => navigation.navigate('VisaoConsolidada')}
        />
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
