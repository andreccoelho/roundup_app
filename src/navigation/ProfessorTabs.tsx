// Raiz "Visão do Gestor" para Professor (SCRIPT.md, Passo 3): abas Hoje, Turmas, Alunos,
// Missões, Perfil. Turmas/Alunos/Missões vêm de GestorTabsCompartilhado.tsx (mesmo bloco usado
// por AcademiaTabs.tsx).
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import DashboardScreen from '../screens/professor/DashboardScreen';
import VincularProfessorScreen from '../screens/professor/VincularProfessorScreen';
import PerfilScreen from '../screens/professor/PerfilScreen';
import SolicitacoesScreen from '../screens/gestor/SolicitacoesScreen';
import PreferenciasNotificacaoScreen from '../screens/compartilhado/PreferenciasNotificacaoScreen';
import { TurmasNavigator, AlunosNavigator, MissoesGestorNavigator } from './GestorTabsCompartilhado';
import { Cores } from '../theme';

export type HojeProfessorStackParamList = { Dashboard: undefined };

export type PerfilProfessorStackParamList = {
  Perfil: undefined;
  VincularProfessor: undefined;
  Solicitacoes: undefined;
  PreferenciasNotificacao: undefined;
};

export type ProfessorTabParamList = {
  Hoje: undefined;
  Turmas: undefined;
  Alunos: undefined;
  Missoes: undefined;
  Perfil: undefined;
};

export type DashboardProfessorNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HojeProfessorStackParamList, 'Dashboard'>,
  BottomTabNavigationProp<ProfessorTabParamList>
>;
export type PerfilProfessorNavigationProp = NativeStackNavigationProp<PerfilProfessorStackParamList, 'Perfil'>;

const HojeStack = createNativeStackNavigator<HojeProfessorStackParamList>();
function HojeNavigator() {
  return (
    <HojeStack.Navigator screenOptions={{ headerShown: false }}>
      <HojeStack.Screen name="Dashboard" component={DashboardScreen} />
    </HojeStack.Navigator>
  );
}

const PerfilStack = createNativeStackNavigator<PerfilProfessorStackParamList>();
function PerfilNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={{ headerShown: true }}>
      <PerfilStack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
      <PerfilStack.Screen
        name="VincularProfessor"
        component={VincularProfessorScreen}
        options={{ title: 'Vincular-se a uma academia' }}
      />
      <PerfilStack.Screen name="Solicitacoes" component={SolicitacoesScreen} options={{ title: 'Solicitações pendentes' }} />
      <PerfilStack.Screen
        name="PreferenciasNotificacao"
        component={PreferenciasNotificacaoScreen}
        options={{ title: 'Preferências de notificação' }}
      />
    </PerfilStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<ProfessorTabParamList>();

export function ProfessorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Cores.preto,
        // cinzaClaro sobre branco mede 2,10:1 — abaixo até do mínimo de 3:1 para componentes de
        // UI (WCAG 1.4.11). cinzaMedio mede 5,33:1, passa também no limiar de texto (4,5:1).
        tabBarInactiveTintColor: Cores.cinzaMedio,
        tabBarStyle: { borderTopColor: Cores.cinzaBorda },
      }}
    >
      <Tab.Screen name="Hoje" component={HojeNavigator} />
      <Tab.Screen name="Turmas" component={TurmasNavigator} />
      <Tab.Screen name="Alunos" component={AlunosNavigator} />
      <Tab.Screen name="Missoes" component={MissoesGestorNavigator} options={{ title: 'Missões' }} />
      <Tab.Screen name="Perfil" component={PerfilNavigator} />
    </Tab.Navigator>
  );
}
