import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/academia/DashboardScreen';
import SolicitacoesAcademiaScreen from '../screens/academia/SolicitacoesAcademiaScreen';
import TurmasScreen from '../screens/gestor/TurmasScreen';
import TurmaDetalheScreen from '../screens/gestor/TurmaDetalheScreen';
import SessaoDetalheScreen from '../screens/gestor/SessaoDetalheScreen';
import { GestorStackParamList } from './types';

export type AcademiaStackParamList = GestorStackParamList & {
  Dashboard: undefined;
  SolicitacoesAcademia: undefined;
};

const Stack = createNativeStackNavigator<AcademiaStackParamList>();

export function AcademiaStack() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="SolicitacoesAcademia" component={SolicitacoesAcademiaScreen} options={{ title: 'Solicitações pendentes' }} />
      <Stack.Screen name="Turmas" component={TurmasScreen} options={{ title: 'Turmas' }} />
      <Stack.Screen name="TurmaDetalhe" component={TurmaDetalheScreen} options={{ title: 'Turma' }} />
      <Stack.Screen name="SessaoDetalhe" component={SessaoDetalheScreen} options={{ title: 'Sessão' }} />
    </Stack.Navigator>
  );
}
