// Raiz "Visão do Gestor" para Academia (SCRIPT.md, Passo 3): mesmas abas Hoje, Turmas, Alunos,
// Missões, Perfil de ProfessorTabs.tsx (Turmas/Alunos/Missões compartilhadas via
// GestorTabsCompartilhado.tsx). A academia ganha, dentro da aba Perfil, "Gestão de professores"
// e "Gestão de alunos" (as duas reaproveitam SolicitacoesScreen, RF07/RF09 lado destinatário,
// cada uma com seu perfilSolicitante) e "Visão consolidada" (RF27).
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
import ConfiguracaoGamificacaoScreen from '../screens/gestor/ConfiguracaoGamificacaoScreen';
import EditarPerfilScreen from '../screens/compartilhado/EditarPerfilScreen';
import ContaPrivacidadeScreen from '../screens/compartilhado/ContaPrivacidadeScreen';
import { TurmasNavigator, AlunosNavigator, MissoesGestorNavigator } from './GestorTabsCompartilhado';
import { IconeSino, IconeTatame, IconeFaixa, IconeBandeira, IconePerfil } from '../components/icones';
import { iconeAba, opcoesFolha, opcoesRaiz, useOpcoesHeader, useOpcoesTabBar } from './opcoesCasca';

export type HojeAcademiaStackParamList = { Dashboard: undefined };

export type PerfilAcademiaStackParamList = {
  Perfil: undefined;
  EditarPerfil: undefined;
  // RF09: a academia recebe vínculo de aluno e de professor — duas rotas para a mesma
  // SolicitacoesScreen, cada uma passando seu perfilSolicitante, para não misturar os dois numa
  // lista só (era o bug: pedido de aluno aparecia dentro de "Gestão de professores").
  SolicitacoesProfessores: { perfilSolicitante: 'professor' };
  SolicitacoesAlunos: { perfilSolicitante: 'aluno' };
  VisaoConsolidada: undefined;
  PreferenciasNotificacao: undefined;
  ConfiguracaoGamificacao: undefined; // RF33
  ContaPrivacidade: undefined;
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
  const opcoesHeader = useOpcoesHeader();
  return (
    <HojeStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: true }}>
      <HojeStack.Screen name="Dashboard" component={DashboardScreen} options={{ ...opcoesRaiz, title: 'Hoje' }} />
    </HojeStack.Navigator>
  );
}

const PerfilStack = createNativeStackNavigator<PerfilAcademiaStackParamList>();
function PerfilNavigator() {
  const opcoesHeader = useOpcoesHeader();
  return (
    <PerfilStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: true }}>
      <PerfilStack.Screen name="Perfil" component={PerfilScreen} options={{ ...opcoesRaiz, title: 'Perfil' }} />
      <PerfilStack.Screen name="EditarPerfil" component={EditarPerfilScreen} options={opcoesFolha('Editar perfil')} />
      <PerfilStack.Screen
        name="SolicitacoesProfessores"
        component={SolicitacoesScreen}
        initialParams={{ perfilSolicitante: 'professor' }}
        options={{ title: 'Gestão de professores' }}
      />
      <PerfilStack.Screen
        name="SolicitacoesAlunos"
        component={SolicitacoesScreen}
        initialParams={{ perfilSolicitante: 'aluno' }}
        options={{ title: 'Gestão de alunos' }}
      />
      <PerfilStack.Screen name="VisaoConsolidada" component={VisaoConsolidadaScreen} options={{ title: 'Visão consolidada' }} />
      <PerfilStack.Screen
        name="PreferenciasNotificacao"
        component={PreferenciasNotificacaoScreen}
        options={opcoesFolha('Notificações', 'concluir')}
      />
      <PerfilStack.Screen
        name="ConfiguracaoGamificacao"
        component={ConfiguracaoGamificacaoScreen}
        options={opcoesFolha('Pontuação e níveis')}
      />
      <PerfilStack.Screen name="ContaPrivacidade" component={ContaPrivacidadeScreen} options={{ title: 'Conta e privacidade' }} />
    </PerfilStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<AcademiaTabParamList>();

export function AcademiaTabs() {
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
