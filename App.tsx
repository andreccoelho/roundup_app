import { useEffect } from 'react';
import { View } from 'react-native';
import {
  Oswald_400Regular,
  Oswald_600SemiBold,
  Oswald_700Bold,
  useFonts,
} from '@expo-google-fonts/oswald';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Cores } from './src/theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontsError] = useFonts({
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
    // Fonte da marca — títulos display e wordmark (docs/DESIGN.md).
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
    <SafeAreaProvider initialMetrics={initialWindowMetrics} style={{ backgroundColor: Cores.fundo }}>
      <View style={{ flex: 1, backgroundColor: Cores.fundo }}>
        <AuthProvider>
          {/* Tema só escuro: ícones claros na status bar em todas as telas. */}
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
