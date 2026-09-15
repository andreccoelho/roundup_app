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
import { IconeSino, IconeTatame, IconeFaixa, IconeBandeira, IconePerfil } from '../components/icones';
import { opcoesHeader, opcoesTabBar } from './opcoesCasca';

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
    <HojeStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: false }}>
      <HojeStack.Screen name="Dashboard" component={DashboardScreen} />
    </HojeStack.Navigator>
  );
}

const PerfilStack = createNativeStackNavigator<PerfilAcademiaStackParamList>();
function PerfilNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: true }}>
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
    <Tab.Navigator screenOptions={opcoesTabBar}>
      <Tab.Screen
        name="Hoje"
        component={HojeNavigator}
        options={{ tabBarIcon: ({ color, size }) => <IconeSino tamanho={size} cor={color} /> }}
      />
      <Tab.Screen
        name="Turmas"
        component={TurmasNavigator}
        options={{ tabBarIcon: ({ color, size }) => <IconeTatame tamanho={size} cor={color} /> }}
      />
      <Tab.Screen
        name="Alunos"
        component={AlunosNavigator}
        options={{ tabBarIcon: ({ color, size }) => <IconeFaixa tamanho={size} cor={color} /> }}
      />
      <Tab.Screen
        name="Missoes"
        component={MissoesGestorNavigator}
        options={{ title: 'Missões', tabBarIcon: ({ color, size }) => <IconeBandeira tamanho={size} cor={color} /> }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilNavigator}
        options={{ tabBarIcon: ({ color, size }) => <IconePerfil tamanho={size} cor={color} /> }}
      />
    </Tab.Navigator>
  );
}
