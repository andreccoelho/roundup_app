// Casca de navegação (tema, header nativo e tab bar) — docs/DESIGN.md, tema só escuro. Usada
// pelas 3 raízes (AlunoTabs, ProfessorTabs, AcademiaTabs) e pelos stacks compartilhados de gestor.
import type { ComponentType, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { DarkTheme, type Theme } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alturas, Cores, FamiliaFonte, TamanhoFonte } from '../theme';
import { useMovimentoReduzido } from '../hooks/useMovimentoReduzido';

// Tema do NavigationContainer: background = fundo evita o "flash" branco entre telas e atrás de
// transições/modais nativos.
export const temaNavegacao: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: Cores.acento,
    background: Cores.fundo,
    card: Cores.fundo,
    text: Cores.texto,
    border: Cores.linha,
    notification: Cores.acento,
  },
};

export const opcoesHeader: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: Cores.fundo },
  headerShadowVisible: false,
  headerTintColor: Cores.texto,
  headerTitleStyle: {
    fontFamily: FamiliaFonte.placarSemiBold,
    fontSize: TamanhoFonte.lg,
    color: Cores.texto,
  },
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: Cores.fundo },
};

// Altura = 56 + inset inferior (home indicator). Antes era 64 fixo, que no iPhone sobrescrevia o
// inset calculado pelo bottom-tabs e jogava os rótulos em cima do indicador.
export function useOpcoesTabBar(): BottomTabNavigationOptions {
  const insets = useSafeAreaInsets();
  const reduzido = useMovimentoReduzido();
  return {
    headerShown: false,
    // Troca de aba em fade curto; sem animação com reduce motion.
    animation: reduzido ? 'none' : 'fade',
    tabBarActiveTintColor: Cores.texto,
    // texto3 sobre fundo: 5,6:1.
    tabBarInactiveTintColor: Cores.texto3,
    tabBarStyle: {
      backgroundColor: Cores.fundo,
      borderTopColor: Cores.linha,
      borderTopWidth: 1,
      height: Alturas.abaBarra + insets.bottom,
      paddingTop: 0,
      paddingBottom: insets.bottom + 4,
    },
    tabBarLabelStyle: {
      fontFamily: FamiliaFonte.placarSemiBold,
      fontSize: TamanhoFonte.xs,
      letterSpacing: 0.5,
    },
  };
}

interface IconeAbaProps {
  tamanho?: number;
  cor?: string;
}

type RenderIconeAba = (props: { focused: boolean; color: string; size: number }) => ReactElement;
const cacheIconesAba = new Map<ComponentType<IconeAbaProps>, RenderIconeAba>();

// Ícone de aba com o traço de acento de 2px em cima quando ativa — o único uso de acento da tab
// bar; o ícone/rótulo ativo continua em `texto`. Cacheado por ícone: a mesma função volta a cada
// render do navigator, sem remontar o ícone.
export function iconeAba(Icone: ComponentType<IconeAbaProps>): RenderIconeAba {
  const existente = cacheIconesAba.get(Icone);
  if (existente) return existente;
  const render: RenderIconeAba = ({ focused, color }) => (
    <View style={styles.iconeAba}>
      <View style={[styles.traco, focused && styles.tracoAtivo]} />
      <Icone tamanho={22} cor={color} />
    </View>
  );
  cacheIconesAba.set(Icone, render);
  return render;
}

const styles = StyleSheet.create({
  iconeAba: { alignItems: 'center', paddingTop: 0 },
  traco: { width: 24, height: 2, marginBottom: 6, backgroundColor: 'transparent' },
  tracoAtivo: { backgroundColor: Cores.acento },
});
