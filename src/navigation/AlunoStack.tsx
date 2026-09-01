import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/aluno/DashboardScreen';

export type AlunoStackParamList = {
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<AlunoStackParamList>();

export function AlunoStack() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}
