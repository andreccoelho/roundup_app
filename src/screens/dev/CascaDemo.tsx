// CascaDemo (só __DEV__) — a casca de navegação real (tab bar, cabeçalho, Large Title) em volta
// de uma composição da Galeria, para ver as telas autenticadas como no app sem login. Usa as mesmas
// opções das raízes de verdade (useOpcoesTabBar, opcoesRaiz, iconeAba); só o conteúdo é fictício.
import { createContext, useContext, type ReactNode } from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  IconeBandeira, IconeCartaoPontuacao, IconeFaixa, IconeFichaTecnica, IconeLuva, IconePerfil, IconeSino, IconeTatame,
  type IconeProps,
} from '../../components/icones';
import type { ComponentType } from 'react';
import { iconeAba, opcoesRaiz, useOpcoesHeader, useOpcoesTabBar, useTemaNavegacao } from '../../navigation/opcoesCasca';

export type PerfilCasca = 'aluno' | 'gestor';

interface Aba {
  nome: string;
  titulo: string;
  icone: ComponentType<IconeProps>;
}

const ABAS: Record<PerfilCasca, Aba[]> = {
  aluno: [
    { nome: 'Treinar', titulo: 'Treinar', icone: IconeLuva },
    { nome: 'Agenda', titulo: 'Agenda', icone: IconeFichaTecnica },
    { nome: 'Missoes', titulo: 'Missões', icone: IconeBandeira },
    { nome: 'Classificacao', titulo: 'Classificação', icone: IconeCartaoPontuacao },
    { nome: 'Perfil', titulo: 'Perfil', icone: IconePerfil },
  ],
  gestor: [
    { nome: 'Hoje', titulo: 'Hoje', icone: IconeSino },
    { nome: 'Turmas', titulo: 'Turmas', icone: IconeTatame },
    { nome: 'Alunos', titulo: 'Alunos', icone: IconeFaixa },
    { nome: 'Missoes', titulo: 'Missões', icone: IconeBandeira },
    { nome: 'Perfil', titulo: 'Perfil', icone: IconePerfil },
  ],
};

const ConteudoContext = createContext<{ aba: string; conteudo: ReactNode }>({ aba: '', conteudo: null });

function Conteudo({ aba }: { aba: string }) {
  const atual = useContext(ConteudoContext);
  return <>{atual.aba === aba ? atual.conteudo : null}</>;
}

const pilhas = new Map<string, ComponentType>();
function pilhaDa(aba: Aba): ComponentType {
  const existente = pilhas.get(aba.nome + aba.titulo);
  if (existente) return existente;
  const Stack = createNativeStackNavigator();
  function Pilha() {
    const opcoesHeader = useOpcoesHeader();
    return (
      <Stack.Navigator screenOptions={{ ...opcoesHeader, headerShown: true }}>
        <Stack.Screen name={`${aba.nome}Raiz`} options={{ ...opcoesRaiz, title: aba.titulo }}>
          {() => <Conteudo aba={aba.nome} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }
  pilhas.set(aba.nome + aba.titulo, Pilha);
  return Pilha;
}

const Tab = createBottomTabNavigator();

interface CascaDemoProps {
  perfil: PerfilCasca;
  aba: string;
  children: ReactNode;
}

export default function CascaDemo({ perfil, aba, children }: CascaDemoProps) {
  const opcoesTabBar = useOpcoesTabBar();
  const tema = useTemaNavegacao();
  return (
    <ConteudoContext.Provider value={{ aba, conteudo: children }}>
      <NavigationIndependentTree>
        <NavigationContainer theme={tema}>
          <Tab.Navigator initialRouteName={aba} screenOptions={opcoesTabBar}>
            {ABAS[perfil].map((a) => (
              <Tab.Screen key={a.nome} name={a.nome} component={pilhaDa(a)} options={{ title: a.titulo, tabBarIcon: iconeAba(a.icone) }} />
            ))}
          </Tab.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </ConteudoContext.Provider>
  );
}
