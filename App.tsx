import { useEffect } from 'react';
import {
  Oswald_400Regular,
  Oswald_600SemiBold,
  Oswald_700Bold,
  useFonts,
} from '@expo-google-fonts/oswald';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontsError] = useFonts({
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
    // Fonte da marca — só lettering "RNDP"/wordmark e título de tela, nunca placar nem corpo.
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
    <AuthProvider>
      {/* Padrão do app: fundo claro nas telas, ícones escuros. LoginScreen (banda preta) sobrescreve com style="light". */}
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
