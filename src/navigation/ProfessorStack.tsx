import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/professor/DashboardScreen';
import VincularProfessorScreen from '../screens/professor/VincularProfessorScreen';
import SolicitacoesProfessorScreen from '../screens/professor/SolicitacoesProfessorScreen';

export type ProfessorStackParamList = {
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
    </Stack.Navigator>
  );
}
