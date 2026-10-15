// Driver nativo de animação só onde existe: no web o react-native-web não tem o módulo nativo e
// avisava "useNativeDriver is not supported" a cada animação — lá a animação roda em JS.
import { Platform } from 'react-native';

export const DRIVER_NATIVO = Platform.OS !== 'web';
