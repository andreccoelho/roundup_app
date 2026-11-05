// RF05: perfil do professor — leitura, edição (EditarPerfilScreen: nome, foto, graduação,
// modalidades), vínculo com academia, solicitações, pontuação, notificações, conta e privacidade, e
// sair. Apresentação em PerfilProfessorVisao.tsx (a mesma da Galeria).
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilProfessorNavigationProp } from '../../navigation/ProfessorTabs';
import { formatarMesAno } from '../../utils/datas';
import Tela from '../../components/ui/Tela';
import PerfilProfessorVisao from './PerfilProfessorVisao';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilProfessorNavigationProp>();

  return (
    <Tela largura="lista" agrupada tituloGrande="Perfil">
      <PerfilProfessorVisao
        nome={usuario?.nome ?? ''}
        fotoUrl={usuario?.fotoUrl}
        email={usuario?.email}
        autonomo={usuario?.autonomo}
        membroDesde={usuario?.criadoEm ? formatarMesAno(usuario.criadoEm) : undefined}
        graduacao={usuario?.graduacao}
        modalidades={usuario?.modalidades ?? []}
        onSolicitacoes={() => navigation.navigate('Solicitacoes')}
        onVincularAcademia={() => navigation.navigate('VincularProfessor')}
        onPontuacao={() => navigation.navigate('ConfiguracaoGamificacao')}
        onEditar={() => navigation.navigate('EditarPerfil')}
        onNotificacoes={() => navigation.navigate('PreferenciasNotificacao')}
        onContaPrivacidade={() => navigation.navigate('ContaPrivacidade')}
        onSair={logout}
      />
    </Tela>
  );
}
