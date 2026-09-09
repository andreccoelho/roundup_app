import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/aluno/DashboardScreen';
import VincularAlunoScreen from '../screens/aluno/VincularAlunoScreen';
import TurmasDisponiveisScreen from '../screens/aluno/TurmasDisponiveisScreen';
import AgendaScreen from '../screens/aluno/AgendaScreen';
import HistoricoScreen from '../screens/aluno/HistoricoScreen';

export type AlunoStackParamList = {
  Dashboard: undefined;
  VincularAluno: undefined;
  TurmasDisponiveis: undefined;
  Agenda: undefined;
  Historico: undefined;
};

const Stack = createNativeStackNavigator<AlunoStackParamList>();

export function AlunoStack() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="VincularAluno" component={VincularAlunoScreen} options={{ title: 'Vincular-se' }} />
      <Stack.Screen name="TurmasDisponiveis" component={TurmasDisponiveisScreen} options={{ title: 'Turmas disponíveis' }} />
      <Stack.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda' }} />
      <Stack.Screen name="Historico" component={HistoricoScreen} options={{ title: 'Histórico' }} />
    </Stack.Navigator>
  );
}
