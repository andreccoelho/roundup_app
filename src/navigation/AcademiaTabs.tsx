// Raiz "Visão do Gestor" para Academia (SCRIPT.md, Passo 3): mesmas abas Hoje, Turmas, Alunos,
// Missões, Perfil de ProfessorTabs.tsx (Turmas/Alunos/Missões compartilhadas via
// GestorTabsCompartilhado.tsx). A academia ganha, dentro da aba Perfil, "Gestão de professores"
// (reaproveita SolicitacoesScreen, RF07 lado destinatário) e "Visão consolidada" (RF27).
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import DashboardScreen from '../screens/academia/DashboardScreen';
import PerfilScreen from '../screens/academia/PerfilScreen';
import VisaoConsolidadaScreen from '../screens/academia/VisaoConsolidadaScreen';
import SolicitacoesScreen from '../screens/gestor/SolicitacoesScreen';
import PreferenciasNotificacaoScreen from '../screens/compartilhado/PreferenciasNotificacaoScreen';
import { TurmasNavigator, AlunosNavigator, MissoesGestorNavigator } from './GestorTabsCompartilhado';
import { Cores } from '../theme';

export type HojeAcademiaStackParamList = { Dashboard: undefined };

export type PerfilAcademiaStackParamList = {
  Perfil: undefined;
  Solicitacoes: undefined;
  VisaoConsolidada: undefined;
  PreferenciasNotificacao: undefined;
};

export type AcademiaTabParamList = {
  Hoje: undefined;
  Turmas: undefined;
  Alunos: undefined;
  Missoes: undefined;
  Perfil: undefined;
};

export type DashboardAcademiaNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HojeAcademiaStackParamList, 'Dashboard'>,
  BottomTabNavigationProp<AcademiaTabParamList>
>;
export type PerfilAcademiaNavigationProp = NativeStackNavigationProp<PerfilAcademiaStackParamList, 'Perfil'>;

const HojeStack = createNativeStackNavigator<HojeAcademiaStackParamList>();
function HojeNavigator() {
  return (
    <HojeStack.Navigator screenOptions={{ headerShown: false }}>
      <HojeStack.Screen name="Dashboard" component={DashboardScreen} />
    </HojeStack.Navigator>
  );
}

const PerfilStack = createNativeStackNavigator<PerfilAcademiaStackParamList>();
function PerfilNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={{ headerShown: true }}>
      <PerfilStack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
      <PerfilStack.Screen name="Solicitacoes" component={SolicitacoesScreen} options={{ title: 'Gestão de professores' }} />
      <PerfilStack.Screen name="VisaoConsolidada" component={VisaoConsolidadaScreen} options={{ title: 'Visão consolidada' }} />
      <PerfilStack.Screen
        name="PreferenciasNotificacao"
        component={PreferenciasNotificacaoScreen}
        options={{ title: 'Preferências de notificação' }}
      />
    </PerfilStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<AcademiaTabParamList>();

export function AcademiaTabs() {
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
