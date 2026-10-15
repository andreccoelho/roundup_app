import { NavigationContainer } from '@react-navigation/native';
import { temaNavegacao } from './opcoesCasca';
import { useAuth } from '../contexts/AuthContext';
import { AuthStack } from './AuthStack';
import { AlunoRaiz } from './AlunoRaiz';
import { ProfessorTabs } from './ProfessorTabs';
import { AcademiaTabs } from './AcademiaTabs';
import LoadingScreen from '../components/LoadingScreen';

export function RootNavigator() {
  const { usuarioAuth, usuario, carregando } = useAuth();

  if (carregando) {
    return <LoadingScreen />;
  }

  function renderRaiz() {
    if (!usuarioAuth) return <AuthStack />;
    switch (usuario?.perfil) {
      case 'aluno':
        return <AlunoRaiz />;
      case 'professor':
        return <ProfessorTabs />;
      case 'academia':
        return <AcademiaTabs />;
      default:
        return <AuthStack />;
    }
  }

  return <NavigationContainer theme={temaNavegacao}>{renderRaiz()}</NavigationContainer>;
}
