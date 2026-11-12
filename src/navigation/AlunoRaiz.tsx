// RN05: decide a raiz do Aluno — bloqueio de vínculo ou as abas. Único lugar que checa vínculo
// ativo; RootNavigator.tsx continua decidindo só pelo perfil, como já fazia (SCRIPT.md, Passo 3:
// "não duplique essa lógica").
import { useCallback, useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { listarResponsaveisAtivosDoAluno } from '../services/vinculos';
import { aoMudarVinculos } from '../utils/eventosVinculo';
import LoadingScreen from '../components/LoadingScreen';
import BloqueioVinculoScreen from '../screens/aluno/BloqueioVinculoScreen';
import VincularAlunoScreen from '../screens/aluno/VincularAlunoScreen';
import { AlunoTabs } from './AlunoTabs';
import { useOpcoesHeader } from './opcoesCasca';

type BloqueioStackParamList = {
  Bloqueio: undefined;
  Vincular: undefined;
};

const Stack = createNativeStackNavigator<BloqueioStackParamList>();

export function AlunoRaiz() {
  const { usuario } = useAuth();
  const opcoesHeader = useOpcoesHeader();
  const [status, setStatus] = useState<'verificando' | 'bloqueado' | 'liberado'>('verificando');

  // `silencioso`: reavaliação disparada por mudança de vínculo não pode trocar a tela por um
  // loading (desmontaria as abas que o aluno está usando) — só troca de lado se o resultado mudar.
  const verificar = useCallback(async (silencioso = false) => {
    if (!usuario) return;
    if (!silencioso) setStatus('verificando');
    try {
      const responsaveis = await listarResponsaveisAtivosDoAluno(usuario.id);
      setStatus(responsaveis.length > 0 ? 'liberado' : 'bloqueado');
    } catch {
      // Falha ao checar não pode liberar a navegação por engano — cai no bloqueio, que
      // oferece "atualizar" para tentar de novo.
      setStatus('bloqueado');
    }
  }, [usuario]);

  useEffect(() => {
    verificar();
  }, [verificar]);

  useEffect(() => aoMudarVinculos(() => verificar(true)), [verificar]);

  if (status === 'verificando') return <LoadingScreen />;
  if (status === 'liberado') return <AlunoTabs />;

  return (
    <Stack.Navigator screenOptions={{ ...opcoesHeader, headerShown: false }}>
      <Stack.Screen name="Bloqueio">
        {({ navigation }) => (
          <BloqueioVinculoScreen onVincular={() => navigation.navigate('Vincular')} onAtualizar={() => verificar()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Vincular" component={VincularAlunoScreen} options={{ headerShown: true, title: 'Vincular-se' }} />
    </Stack.Navigator>
  );
}
