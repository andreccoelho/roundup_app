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
import { IconeSino, IconeTatame, IconeFaixa, IconeBandeira, IconePerfil } from '../components/icones';
import { opcoesHeader, opcoesTabBar } from './opcoesCasca';

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
    <HojeStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: false }}>
      <HojeStack.Screen name="Dashboard" component={DashboardScreen} />
    </HojeStack.Navigator>
  );
}

const PerfilStack = createNativeStackNavigator<PerfilProfessorStackParamList>();
function PerfilNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: true }}>
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
