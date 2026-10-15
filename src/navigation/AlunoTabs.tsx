// Raiz "Visão do Aluno" (SCRIPT.md, Passo 3): abas Treinar, Agenda, Missões, Classificação,
// Perfil — cada uma com seu próprio native-stack. Missões e Classificação dependem de dados
// ainda bloqueados em firestore.rules (RF16-RF21, Ciclo 2): shell de navegação real, conteúdo
// em TelaEmBreve.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import DashboardScreen from '../screens/aluno/DashboardScreen';
import AgendaScreen from '../screens/aluno/AgendaScreen';
import HistoricoScreen from '../screens/aluno/HistoricoScreen';
import TurmasDisponiveisScreen from '../screens/aluno/TurmasDisponiveisScreen';
import VincularAlunoScreen from '../screens/aluno/VincularAlunoScreen';
import PerfilScreen from '../screens/aluno/PerfilScreen';
import MissoesScreen from '../screens/aluno/MissoesScreen';
import ClassificacaoScreen from '../screens/aluno/ClassificacaoScreen';
import PreferenciasNotificacaoScreen from '../screens/compartilhado/PreferenciasNotificacaoScreen';
import EditarPerfilScreen from '../screens/compartilhado/EditarPerfilScreen';
import { IconeLuva, IconeFichaTecnica, IconeBandeira, IconeCartaoPontuacao, IconePerfil } from '../components/icones';
import { iconeAba, opcoesHeader, useOpcoesTabBar } from './opcoesCasca';

export type TreinarStackParamList = {
  Dashboard: undefined;
  TurmasDisponiveis: undefined;
  Historico: undefined;
};

export type PerfilAlunoStackParamList = {
  Perfil: undefined;
  EditarPerfil: undefined;
  VincularAluno: undefined;
  PreferenciasNotificacao: undefined;
};

export type AlunoTabParamList = {
  Treinar: undefined;
  Agenda: undefined;
  Missoes: undefined;
  Classificacao: undefined;
  Perfil: undefined;
};

// Dashboard precisa navegar dentro do próprio stack (TurmasDisponiveis, Historico) e para a aba
// Agenda (irmã, fora do stack) — CompositeNavigationProp cobre os dois casos.
export type DashboardAlunoNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<TreinarStackParamList, 'Dashboard'>,
  BottomTabNavigationProp<AlunoTabParamList>
>;
export type PerfilAlunoNavigationProp = NativeStackNavigationProp<PerfilAlunoStackParamList, 'Perfil'>;

const TreinarStack = createNativeStackNavigator<TreinarStackParamList>();
function TreinarNavigator() {
  return (
    <TreinarStack.Navigator initialRouteName="Dashboard" screenOptions={{ ...opcoesHeader, headerShown: false }}>
      <TreinarStack.Screen name="Dashboard" component={DashboardScreen} />
      <TreinarStack.Screen
        name="TurmasDisponiveis"
        component={TurmasDisponiveisScreen}
        options={{ headerShown: true, title: 'Turmas disponíveis' }}
      />
      <TreinarStack.Screen name="Historico" component={HistoricoScreen} options={{ headerShown: true, title: 'Histórico' }} />
    </TreinarStack.Navigator>
  );
}

type AgendaStackParamList = { Agenda: undefined };
const AgendaStack = createNativeStackNavigator<AgendaStackParamList>();
function AgendaNavigator() {
  return (
    <AgendaStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: true }}>
      <AgendaStack.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda' }} />
    </AgendaStack.Navigator>
  );
}

type MissoesStackParamList = { Missoes: undefined };
const MissoesStack = createNativeStackNavigator<MissoesStackParamList>();
function MissoesNavigator() {
  return (
    <MissoesStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: true }}>
      <MissoesStack.Screen name="Missoes" component={MissoesScreen} options={{ title: 'Missões' }} />
    </MissoesStack.Navigator>
  );
}

type ClassificacaoStackParamList = { Classificacao: undefined };
const ClassificacaoStack = createNativeStackNavigator<ClassificacaoStackParamList>();
function ClassificacaoNavigator() {
  return (
    <ClassificacaoStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: true }}>
      <ClassificacaoStack.Screen name="Classificacao" component={ClassificacaoScreen} options={{ title: 'Classificação' }} />
    </ClassificacaoStack.Navigator>
  );
}

const PerfilStack = createNativeStackNavigator<PerfilAlunoStackParamList>();
function PerfilNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: true }}>
      <PerfilStack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
      <PerfilStack.Screen name="EditarPerfil" component={EditarPerfilScreen} options={{ title: 'Editar perfil' }} />
      <PerfilStack.Screen name="VincularAluno" component={VincularAlunoScreen} options={{ title: 'Meus vínculos' }} />
      <PerfilStack.Screen
        name="PreferenciasNotificacao"
        component={PreferenciasNotificacaoScreen}
        options={{ title: 'Preferências de notificação' }}
      />
    </PerfilStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<AlunoTabParamList>();

export function AlunoTabs() {
  const opcoesTabBar = useOpcoesTabBar();
  return (
    <Tab.Navigator screenOptions={opcoesTabBar}>
      <Tab.Screen
        name="Treinar"
        component={TreinarNavigator}
        options={{ tabBarIcon: iconeAba(IconeLuva) }}
      />
      <Tab.Screen
        name="Agenda"
        component={AgendaNavigator}
        options={{ tabBarIcon: iconeAba(IconeFichaTecnica) }}
      />
      <Tab.Screen
        name="Missoes"
        component={MissoesNavigator}
        options={{ title: 'Missões', tabBarIcon: iconeAba(IconeBandeira) }}
      />
      <Tab.Screen
        name="Classificacao"
        component={ClassificacaoNavigator}
        options={{ title: 'Classificação', tabBarIcon: iconeAba(IconeCartaoPontuacao) }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilNavigator}
        options={{ tabBarIcon: iconeAba(IconePerfil) }}
      />
    </Tab.Navigator>
  );
}
