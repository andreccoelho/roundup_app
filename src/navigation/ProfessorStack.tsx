import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/professor/DashboardScreen';
import VincularProfessorScreen from '../screens/professor/VincularProfessorScreen';
import SolicitacoesProfessorScreen from '../screens/professor/SolicitacoesProfessorScreen';
import TurmasScreen from '../screens/gestor/TurmasScreen';
import TurmaDetalheScreen from '../screens/gestor/TurmaDetalheScreen';
import SessaoDetalheScreen from '../screens/gestor/SessaoDetalheScreen';
import { GestorStackParamList } from './types';

export type ProfessorStackParamList = GestorStackParamList & {
  Dashboard: undefined;
  VincularProfessor: undefined;
  SolicitacoesProfessor: undefined;
};

const Stack = createNativeStackNavigator<ProfessorStackParamList>();

export function ProfessorStack() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="VincularProfessor" component={VincularProfessorScreen} options={{ title: 'Vincular-se a uma academia' }} />
      <Stack.Screen name="SolicitacoesProfessor" component={SolicitacoesProfessorScreen} options={{ title: 'Solicitações pendentes' }} />
      <Stack.Screen name="Turmas" component={TurmasScreen} options={{ title: 'Turmas' }} />
      <Stack.Screen name="TurmaDetalhe" component={TurmaDetalheScreen} options={{ title: 'Turma' }} />
      <Stack.Screen name="SessaoDetalhe" component={SessaoDetalheScreen} options={{ title: 'Sessão' }} />
    </Stack.Navigator>
  );
}
