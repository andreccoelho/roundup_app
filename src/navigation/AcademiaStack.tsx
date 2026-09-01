import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/academia/DashboardScreen';
import SolicitacoesAcademiaScreen from '../screens/academia/SolicitacoesAcademiaScreen';

export type AcademiaStackParamList = {
  Dashboard: undefined;
  SolicitacoesAcademia: undefined;
};

const Stack = createNativeStackNavigator<AcademiaStackParamList>();

export function AcademiaStack() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="SolicitacoesAcademia" component={SolicitacoesAcademiaScreen} options={{ title: 'Solicitações pendentes' }} />
    </Stack.Navigator>
  );
}
