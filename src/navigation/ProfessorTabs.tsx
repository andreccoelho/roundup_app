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
import ConfiguracaoGamificacaoScreen from '../screens/gestor/ConfiguracaoGamificacaoScreen';
import EditarPerfilScreen from '../screens/compartilhado/EditarPerfilScreen';
import ContaPrivacidadeScreen from '../screens/compartilhado/ContaPrivacidadeScreen';
import { TurmasNavigator, AlunosNavigator, MissoesGestorNavigator } from './GestorTabsCompartilhado';
import { IconeSino, IconeTatame, IconeFaixa, IconeBandeira, IconePerfil } from '../components/icones';
import { iconeAba, opcoesHeader, useOpcoesTabBar } from './opcoesCasca';

export type HojeProfessorStackParamList = { Dashboard: undefined };

export type PerfilProfessorStackParamList = {
  Perfil: undefined;
  EditarPerfil: undefined;
  VincularProfessor: undefined;
  Solicitacoes: undefined;
  PreferenciasNotificacao: undefined;
  ConfiguracaoGamificacao: undefined; // RF33
  ContaPrivacidade: undefined;
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
      <PerfilStack.Screen name="EditarPerfil" component={EditarPerfilScreen} options={{ title: 'Editar perfil' }} />
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
      <PerfilStack.Screen
        name="ConfiguracaoGamificacao"
        component={ConfiguracaoGamificacaoScreen}
        options={{ title: 'Pontuação e níveis' }}
      />
      <PerfilStack.Screen name="ContaPrivacidade" component={ContaPrivacidadeScreen} options={{ title: 'Conta e privacidade' }} />
    </PerfilStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<ProfessorTabParamList>();

export function ProfessorTabs() {
  const opcoesTabBar = useOpcoesTabBar();
  return (
    <Tab.Navigator screenOptions={opcoesTabBar}>
      <Tab.Screen
        name="Hoje"
        component={HojeNavigator}
        options={{ tabBarIcon: iconeAba(IconeSino) }}
      />
      <Tab.Screen
        name="Turmas"
        component={TurmasNavigator}
        options={{ tabBarIcon: iconeAba(IconeTatame) }}
      />
      <Tab.Screen
        name="Alunos"
        component={AlunosNavigator}
        options={{ tabBarIcon: iconeAba(IconeFaixa) }}
      />
      <Tab.Screen
        name="Missoes"
        component={MissoesGestorNavigator}
        options={{ title: 'Missões', tabBarIcon: iconeAba(IconeBandeira) }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilNavigator}
        options={{ tabBarIcon: iconeAba(IconePerfil) }}
      />
    </Tab.Navigator>
  );
}
