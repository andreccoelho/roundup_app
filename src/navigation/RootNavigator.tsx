import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { AuthStack } from './AuthStack';
import { AlunoStack } from './AlunoStack';
import { ProfessorStack } from './ProfessorStack';
import { AcademiaStack } from './AcademiaStack';
import LoadingScreen from '../components/LoadingScreen';

export function RootNavigator() {
  const { usuarioAuth, usuario, carregando } = useAuth();

  if (carregando) {
    return <LoadingScreen />;
  }

  function renderStack() {
    if (!usuarioAuth) return <AuthStack />;
    switch (usuario?.perfil) {
      case 'aluno':
        return <AlunoStack />;
      case 'professor':
        return <ProfessorStack />;
      case 'academia':
        return <AcademiaStack />;
      default:
        return <AuthStack />;
    }
  }

  return <NavigationContainer>{renderStack()}</NavigationContainer>;
}
