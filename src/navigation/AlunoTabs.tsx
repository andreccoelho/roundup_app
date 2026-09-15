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
import { Cores } from '../theme';

export type TreinarStackParamList = {
  Dashboard: undefined;
  TurmasDisponiveis: undefined;
  Historico: undefined;
};

export type PerfilAlunoStackParamList = {
  Perfil: undefined;
  VincularAluno: undefined;
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
    <TreinarStack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
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
    <AgendaStack.Navigator screenOptions={{ headerShown: true }}>
      <AgendaStack.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda' }} />
    </AgendaStack.Navigator>
  );
}

type MissoesStackParamList = { Missoes: undefined };
const MissoesStack = createNativeStackNavigator<MissoesStackParamList>();
function MissoesNavigator() {
  return (
    <MissoesStack.Navigator screenOptions={{ headerShown: true }}>
      <MissoesStack.Screen name="Missoes" component={MissoesScreen} options={{ title: 'Missões' }} />
    </MissoesStack.Navigator>
  );
}

type ClassificacaoStackParamList = { Classificacao: undefined };
const ClassificacaoStack = createNativeStackNavigator<ClassificacaoStackParamList>();
function ClassificacaoNavigator() {
  return (
    <ClassificacaoStack.Navigator screenOptions={{ headerShown: true }}>
      <ClassificacaoStack.Screen name="Classificacao" component={ClassificacaoScreen} options={{ title: 'Classificação' }} />
    </ClassificacaoStack.Navigator>
  );
}

const PerfilStack = createNativeStackNavigator<PerfilAlunoStackParamList>();
function PerfilNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={{ headerShown: true }}>
      <PerfilStack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
      <PerfilStack.Screen name="VincularAluno" component={VincularAlunoScreen} options={{ title: 'Meus vínculos' }} />
    </PerfilStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<AlunoTabParamList>();

export function AlunoTabs() {
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
      <Tab.Screen name="Treinar" component={TreinarNavigator} />
      <Tab.Screen name="Agenda" component={AgendaNavigator} />
      <Tab.Screen name="Missoes" component={MissoesNavigator} options={{ title: 'Missões' }} />
      <Tab.Screen name="Classificacao" component={ClassificacaoNavigator} options={{ title: 'Classificação' }} />
      <Tab.Screen name="Perfil" component={PerfilNavigator} />
    </Tab.Navigator>
  );
}
