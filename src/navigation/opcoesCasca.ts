// Estilo compartilhado da casca de navegação (header nativo + tab bar) — DESIGN_BRIEF.md,
// usado pelas 3 raízes (AlunoTabs, ProfessorTabs, AcademiaTabs) e pelos stacks compartilhados de
// gestor (GestorTabsCompartilhado.tsx), para não repetir o mesmo objeto de estilo em 11
// navigators diferentes.
//
// Título de tela usa Oswald (placarSemiBold), não Homebase: o teste de legibilidade/kerning da
// Homebase em tamanho de título (seção "Teste de acentuação" da Galeria) ainda não foi aprovado
// — trocar para FamiliaFonte.homebaseDisplay só depois dessa aprovação.
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Cores, Espacamento, FamiliaFonte, TamanhoFonte } from '../theme';

export const opcoesHeader: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: Cores.branco },
  headerShadowVisible: false,
  headerTintColor: Cores.preto,
  headerTitleStyle: {
    fontFamily: FamiliaFonte.placarSemiBold,
    fontSize: TamanhoFonte.lg,
    color: Cores.preto,
  },
  // Só a seta, sem repetir o título da tela anterior ao lado — mais denso, menos decoração.
  headerBackButtonDisplayMode: 'minimal',
};

export const opcoesTabBar: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: Cores.preto,
  // cinzaClaro sobre branco mede 2,10:1 — abaixo até do mínimo de 3:1 para componentes de UI
  // (WCAG 1.4.11). cinzaMedio mede 5,33:1, passa também no limiar de texto (4,5:1).
  tabBarInactiveTintColor: Cores.cinzaMedio,
  tabBarStyle: {
    backgroundColor: Cores.branco,
    borderTopColor: Cores.cinzaBorda,
    borderTopWidth: 1,
    height: 64,
    paddingTop: Espacamento.pequeno,
    paddingBottom: Espacamento.pequeno,
  },
  tabBarLabelStyle: {
    fontSize: TamanhoFonte.xs,
    fontWeight: '600',
  },
};
