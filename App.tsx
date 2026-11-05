import { useEffect } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ProvedorTema, useTema } from './src/theme';

SplashScreen.preventAutoHideAsync();

// Fundo da raiz no tema atual: evita o flash da cor errada atrás das transições nativas
function Raiz() {
  const { cores } = useTema();
  // expo-system-ui (R-02): a view nativa da raiz acompanha o tema — sem isso, transições e o
  // teclado mostram por um instante a cor fixa do app.json
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(cores.fundo).catch(() => {});
  }, [cores.fundo]);
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics} style={{ backgroundColor: cores.fundo }}>
      <View style={{ flex: 1, backgroundColor: cores.fundo }}>
        <AuthProvider>
          {/* Claro/escuro seguem o aparelho: a status bar acompanha ("auto"). */}
          <StatusBar style="auto" />
          <RootNavigator />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  const [fontsLoaded, fontsError] = useFonts({
    // Fonte da marca — só wordmark (docs/DESIGN.md). O resto do app usa a fonte do sistema.
    Homebase: require('./assets/fonts/homebase.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <ProvedorTema>
      <Raiz />
    </ProvedorTema>
  );
}
