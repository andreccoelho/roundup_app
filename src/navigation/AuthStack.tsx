import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RecuperarSenhaScreen from '../screens/auth/RecuperarSenhaScreen';
import SelecaoPerfilScreen from '../screens/auth/SelecaoPerfilScreen';
import ConsentimentoLGPDScreen from '../screens/auth/ConsentimentoLGPDScreen';
import CadastroAlunoScreen from '../screens/auth/CadastroAlunoScreen';
import CadastroProfessorScreen from '../screens/auth/CadastroProfessorScreen';
import CadastroAcademiaScreen from '../screens/auth/CadastroAcademiaScreen';
import GaleriaScreen from '../screens/dev/GaleriaScreen';

// RF01: seleção de perfil decide qual dos 3 formulários de cadastro é aberto em seguida.
// RF28: consentimento LGPD entra entre a seleção e o cadastro — as 3 telas de Cadastro exigem
// os params consentimentoAceito/versaoConsentimento, só alcançáveis vindo de ConsentimentoLGPD
// (ver comentário em ConsentimentoLGPDScreen.tsx sobre por que o registro em si só é gravado
// depois, dentro de cada tela de Cadastro).
export type DadosConsentimento = { consentimentoAceito: boolean; versaoConsentimento: string };

export type AuthStackParamList = {
  Login: undefined;
  RecuperarSenha: undefined;
  SelecaoPerfil: undefined;
  ConsentimentoLGPD: { destino: 'CadastroAluno' | 'CadastroProfessor' | 'CadastroAcademia' };
  CadastroAluno: DadosConsentimento;
  CadastroProfessor: DadosConsentimento;
  CadastroAcademia: DadosConsentimento;
  Galeria: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
      <Stack.Screen name="SelecaoPerfil" component={SelecaoPerfilScreen} />
      <Stack.Screen name="ConsentimentoLGPD" component={ConsentimentoLGPDScreen} />
      <Stack.Screen name="CadastroAluno" component={CadastroAlunoScreen} />
      <Stack.Screen name="CadastroProfessor" component={CadastroProfessorScreen} />
      <Stack.Screen name="CadastroAcademia" component={CadastroAcademiaScreen} />
      {/* SCRIPT.md Passo 2: galeria acessível só em __DEV__ — em build de produção __DEV__ é
          false, a rota nem é registrada. */}
      {__DEV__ && (
        <Stack.Screen name="Galeria" component={GaleriaScreen} options={{ headerShown: true, title: 'Galeria de componentes' }} />
      )}
    </Stack.Navigator>
  );
}
