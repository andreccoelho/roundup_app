import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RecuperarSenhaScreen from '../screens/auth/RecuperarSenhaScreen';
import SelecaoPerfilScreen from '../screens/auth/SelecaoPerfilScreen';
import CadastroAlunoScreen from '../screens/auth/CadastroAlunoScreen';
import CadastroProfessorScreen from '../screens/auth/CadastroProfessorScreen';
import CadastroAcademiaScreen from '../screens/auth/CadastroAcademiaScreen';

// RF01: seleção de perfil decide qual dos 3 formulários de cadastro é aberto em seguida
export type AuthStackParamList = {
  Login: undefined;
  RecuperarSenha: undefined;
  SelecaoPerfil: undefined;
  CadastroAluno: undefined;
  CadastroProfessor: undefined;
  CadastroAcademia: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
      <Stack.Screen name="SelecaoPerfil" component={SelecaoPerfilScreen} />
      <Stack.Screen name="CadastroAluno" component={CadastroAlunoScreen} />
      <Stack.Screen name="CadastroProfessor" component={CadastroProfessorScreen} />
      <Stack.Screen name="CadastroAcademia" component={CadastroAcademiaScreen} />
    </Stack.Navigator>
  );
}
