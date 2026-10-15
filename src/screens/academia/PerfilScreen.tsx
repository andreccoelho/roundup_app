// RF04: perfil da academia — leitura, edição (EditarPerfilScreen: nome, foto, nome da academia,
// endereço, modalidades), gestão de professores, gestão de alunos, visão consolidada,
// notificações, conta e privacidade, e sair. A identidade da banda é a academia (nomeAcademia),
// não a pessoa de contato. "Excluir conta" vive na subtela "Conta e privacidade".
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilAcademiaNavigationProp } from '../../navigation/AcademiaTabs';
import { formatarMesAno } from '../../utils/datas';
import Tela from '../../components/ui/Tela';
import BandaIdentidade from '../../components/ui/BandaIdentidade';
import Etiqueta from '../../components/ui/Etiqueta';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
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
  const detalhes = [
    usuario?.endereco,
    usuario?.nome ? `Responsável: ${usuario.nome}` : undefined,
    usuario?.criadoEm ? `Membro desde ${formatarMesAno(usuario.criadoEm)}` : undefined,
  ].filter((d): d is string => Boolean(d));

  return (
    <Tela largura="lista" preenchimento={false}>
      <BandaIdentidade
        variante="gestor"
        sobHeader
        nome={usuario?.nomeAcademia ?? usuario?.nome ?? ''}
        fotoUrl={usuario?.fotoUrl}
        detalhes={detalhes}
      />

      <View style={styles.corpo}>
        {modalidades.length > 0 ? (
          <>
            <CabecalhoSecao titulo="Modalidades" semMargem />
            <View style={styles.modalidades}>
              {modalidades.map((m) => (
                <Etiqueta key={m} texto={m} />
              ))}
            </View>
          </>
        ) : null}

        <CabecalhoSecao titulo="Gestão" />
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
          separador
        />
        <ItemMenu
          rotulo="Visão consolidada"
          descricao="Turmas, equipe e frequência da unidade"
          icone={IconeCartaoPontuacao}
          onPress={() => navigation.navigate('VisaoConsolidada')}
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
  modalidades: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno },
});
