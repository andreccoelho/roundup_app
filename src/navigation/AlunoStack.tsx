import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/aluno/DashboardScreen';
import VincularAlunoScreen from '../screens/aluno/VincularAlunoScreen';

export type AlunoStackParamList = {
  Dashboard: undefined;
  VincularAluno: undefined;
};

const Stack = createNativeStackNavigator<AlunoStackParamList>();

export function AlunoStack() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="VincularAluno" component={VincularAlunoScreen} options={{ title: 'Vincular-se' }} />
    </Stack.Navigator>
  );
}
