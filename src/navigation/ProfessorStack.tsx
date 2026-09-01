import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/professor/DashboardScreen';

export type ProfessorStackParamList = {
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<ProfessorStackParamList>();

export function ProfessorStack() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}
