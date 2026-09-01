import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/academia/DashboardScreen';

export type AcademiaStackParamList = {
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<AcademiaStackParamList>();

export function AcademiaStack() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}
