// Blocos de navegação compartilhados entre ProfessorTabs.tsx e AcademiaTabs.tsx — mesmas abas
// Turmas, Alunos e Missões nas duas raízes de Gestor (SCRIPT.md, Passo 3).
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TurmasScreen from '../screens/gestor/TurmasScreen';
import TurmaDetalheScreen from '../screens/gestor/TurmaDetalheScreen';
import SessaoDetalheScreen from '../screens/gestor/SessaoDetalheScreen';
import RelatorioFrequenciaScreen from '../screens/gestor/RelatorioFrequenciaScreen';
import AlunosScreen from '../screens/gestor/AlunosScreen';
import RegistrarGraduacaoScreen from '../screens/gestor/RegistrarGraduacaoScreen';
import MissoesGestorScreen from '../screens/gestor/MissoesGestorScreen';
import { GestorStackParamList } from './types';
import { opcoesFolha, opcoesRaiz, useOpcoesHeader } from './opcoesCasca';

const TurmasStack = createNativeStackNavigator<GestorStackParamList>();

export function TurmasNavigator() {
  const opcoesHeader = useOpcoesHeader();
  return (
    <TurmasStack.Navigator initialRouteName="Turmas" screenOptions={{ ...opcoesHeader, headerShown: true }}>
      <TurmasStack.Screen name="Turmas" component={TurmasScreen} options={{ ...opcoesRaiz, title: 'Turmas' }} />
      <TurmasStack.Screen name="TurmaDetalhe" component={TurmaDetalheScreen} options={{ title: 'Turma' }} />
      <TurmasStack.Screen name="SessaoDetalhe" component={SessaoDetalheScreen} options={{ title: 'Sessão' }} />
      <TurmasStack.Screen
        name="RelatorioFrequencia"
        component={RelatorioFrequenciaScreen}
        options={{ title: 'Relatório de frequência' }}
      />
    </TurmasStack.Navigator>
  );
}

// RF24, RF25: lista de alunos com frequência, tocar num aluno leva ao registro de graduação.
export type AlunosStackParamList = {
  Alunos: undefined;
  RegistrarGraduacao: { alunoId: string; nomeAluno: string };
};
const AlunosStack = createNativeStackNavigator<AlunosStackParamList>();

export function AlunosNavigator() {
  const opcoesHeader = useOpcoesHeader();
  return (
    <AlunosStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: true }}>
      <AlunosStack.Screen name="Alunos" component={AlunosScreen} options={{ ...opcoesRaiz, title: 'Alunos' }} />
      <AlunosStack.Screen
        name="RegistrarGraduacao"
        component={RegistrarGraduacaoScreen}
        options={opcoesFolha('Registrar graduação')}
      />
    </AlunosStack.Navigator>
  );
}

type MissoesGestorStackParamList = { Missoes: undefined };
const MissoesGestorStack = createNativeStackNavigator<MissoesGestorStackParamList>();

export function MissoesGestorNavigator() {
  const opcoesHeader = useOpcoesHeader();
  return (
    <MissoesGestorStack.Navigator screenOptions={{ ...opcoesHeader, headerShown: true }}>
      <MissoesGestorStack.Screen name="Missoes" component={MissoesGestorScreen} options={{ ...opcoesRaiz, title: 'Missões' }} />
    </MissoesGestorStack.Navigator>
  );
}
