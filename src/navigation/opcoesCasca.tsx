// Casca de navegação (tema, header nativo e tab bar) — docs/DESIGN.md. Usada pelas 3 raízes
// (AlunoTabs, ProfessorTabs, AcademiaTabs), pelos stacks compartilhados de gestor e pela autenticação.
//
// iOS: cabeçalho transparente com material translúcido (headerBlurEffect), Large Title nas telas
// raiz de cada aba, que encolhe ao rolar (a Tela usa contentInsetAdjustmentBehavior). Android e
// web: cabeçalho sólido no fundo da tela; nas raízes das abas o cabeçalho some e a própria Tela
// desenha o título grande (prop `tituloGrande`), para o mesmo desenho aparecer nas três
// plataformas. Tab bar translúcida (expo-blur) no iOS e no web; sólida no Android e com "reduzir
// transparência" ligado.
import type { ComponentType, ReactElement } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Tipografia, useTema } from '../theme';
import { useMovimentoReduzido } from '../hooks/useMovimentoReduzido';
import { useTransparenciaReduzida } from '../hooks/useTransparenciaReduzida';
import BotaoCabecalho from '../components/ui/BotaoCabecalho';
import type { IconeProps } from '../components/icones';

const IOS = Platform.OS === 'ios';

// Tema do NavigationContainer: background = fundo evita o "flash" da cor errada entre telas e atrás
// de transições/modais nativos.
export function useTemaNavegacao(): Theme {
  const { cores, escuro } = useTema();
  const base = escuro ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: escuro,
    colors: {
      ...base.colors,
      primary: cores.tint,
      background: cores.fundoAgrupado,
      card: cores.fundoAgrupado,
      text: cores.texto,
      border: cores.separador,
      notification: cores.tint,
    },
  };
}

// Telas empilhadas (detalhe, formulário): título pequeno no centro (iOS) ou à esquerda (Android).
export function useOpcoesHeader(): NativeStackNavigationOptions {
  const { cores } = useTema();
  return {
    headerTintColor: cores.tint,
    headerTitleStyle: { ...Tipografia.headline, color: cores.texto } as NativeStackNavigationOptions['headerTitleStyle'],
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: cores.fundoAgrupado },
    ...(IOS
      ? {
          headerTransparent: true,
          headerBlurEffect: 'systemChromeMaterial',
          headerShadowVisible: true,
          headerLargeTitleShadowVisible: false,
          headerLargeTitleStyle: { color: cores.texto },
        }
      : {
          headerStyle: { backgroundColor: cores.fundoAgrupado },
          headerShadowVisible: false,
        }),
  };
}

// Tela raiz de uma aba: Large Title no iOS; fora dele, a Tela desenha o título (`tituloGrande`).
export const opcoesRaiz: NativeStackNavigationOptions = IOS ? { headerShown: true, headerLargeTitle: true } : { headerShown: false };

// Fluxos curtos (editar perfil, preferências, registrar graduação, pontuação): sheet do iOS
// (presentation "modal" = pageSheet, com header próprio e gesto de fechar). "Cancelar" à esquerda;
// a ação de confirmar ("Salvar") a tela põe à direita com navigation.setOptions. No web e no
// Android a apresentação é a de uma tela empilhada, com o mesmo "Cancelar".
export function opcoesFolha(titulo: string) {
  return ({ navigation }: { navigation: { goBack: () => void } }): NativeStackNavigationOptions => ({
    title: titulo,
    presentation: 'modal',
    headerLargeTitle: false,
    headerBackVisible: false,
    headerLeft: () => <BotaoCabecalho titulo="Cancelar" onPress={navigation.goBack} />,
  });
}

export function useOpcoesTabBar(): BottomTabNavigationOptions {
  const reduzido = useMovimentoReduzido();
  const semTransparencia = useTransparenciaReduzida() || Platform.OS === 'android';
  const { cores, escuro } = useTema();

  return {
    headerShown: false,
    // Troca de aba em fade curto; sem animação com reduce motion.
    animation: reduzido ? 'none' : 'fade',
    tabBarActiveTintColor: cores.tint,
    // texto3: 5,4:1 no claro, 7,3:1 no escuro, sobre o fundo da barra
    tabBarInactiveTintColor: cores.texto3,
    tabBarStyle: {
      position: 'absolute',
      backgroundColor: semTransparencia ? cores.superficie : 'transparent',
      borderTopColor: cores.separador,
      borderTopWidth: StyleSheet.hairlineWidth,
      // Altura e padding ficam com o bottom-tabs (49 + inset inferior, como o UITabBar)
      elevation: 0,
    },
    tabBarBackground: semTransparencia
      ? undefined
      : () => (
          <BlurView
            tint={IOS ? 'systemChromeMaterial' : escuro ? 'dark' : 'light'}
            intensity={IOS ? 100 : 80}
            style={[StyleSheet.absoluteFill, !IOS && { backgroundColor: escuro ? 'rgba(22,22,24,0.78)' : 'rgba(249,249,249,0.82)' }]}
          />
        ),
    tabBarLabelStyle: { fontSize: 10, lineHeight: 12, fontWeight: '500' },
    tabBarAllowFontScaling: false,
  };
}

type RenderIconeAba = (props: { focused: boolean; color: string; size: number }) => ReactElement;
const cacheIconesAba = new Map<ComponentType<IconeProps>, RenderIconeAba>();

// Ícone de aba: versão preenchida na aba ativa e contorno nas demais, como na tab bar do iOS.
// Cacheado por ícone: a mesma função volta a cada render do navigator, sem remontar o ícone.
export function iconeAba(Icone: ComponentType<IconeProps>): RenderIconeAba {
  const existente = cacheIconesAba.get(Icone);
  if (existente) return existente;
  const render: RenderIconeAba = ({ focused, color }) => (
    <View style={styles.iconeAba}>
      <Icone tamanho={24} cor={color} preenchido={focused} />
    </View>
  );
  cacheIconesAba.set(Icone, render);
  return render;
}

const styles = StyleSheet.create({
  iconeAba: { alignItems: 'center', justifyContent: 'center' },
});
