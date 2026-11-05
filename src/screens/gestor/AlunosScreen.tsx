// RF24: alunos sob responsabilidade do gestor, com frequência recente. Toca num aluno para
// registrar graduação (RF25). RF32: sinaliza queda de frequência (critério provisório em
// src/config/gamificacao.ts) reaproveitando CartaoAluno — sem tela nem componente novos.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { criarEstilos, Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarAlunosComFrequencia, AlunoComFrequencia } from '../../services/frequencia';
import { AlunosStackParamList } from '../../navigation/GestorTabsCompartilhado';
import CartaoAluno from '../../components/ui/CartaoAluno';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import GrupoLista from '../../components/ui/GrupoLista';
import { IconeFaixa } from '../../components/icones';
import { mensagemErro } from '../../utils/mensagensErro';

export default function AlunosScreen() {
  const styles = useEstilos();
  const { usuario } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AlunosStackParamList, 'Alunos'>>();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [alunos, setAlunos] = useState<AlunoComFrequencia[]>([]);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      setAlunos(await listarAlunosComFrequencia(usuario.id));
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar seus alunos agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <Tela largura="lista" agrupada tituloGrande="Alunos">
        <Esqueleto forma="linha" repeticoes={6} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  if (alunos.length === 0) {
    return (
      <Tela largura="lista" agrupada tituloGrande="Alunos" centralizarVertical>
        <EstadoVazio icone={IconeFaixa} titulo="Nenhum aluno matriculado" descricao="Alunos aparecem aqui assim que se matricularem em uma turma sua." />
      </Tela>
    );
  }

  const emQueda = alunos.filter((a) => a.quedaFrequencia).length;

  return (
    <Tela largura="lista" agrupada tituloGrande="Alunos">
      <Texto variante="subheadline" style={styles.intro}>
        Toque num aluno para registrar graduação. As marcas mostram as últimas presenças.
      </Texto>
      <GrupoLista titulo={emQueda > 0 ? `${alunos.length} alunos, ${emQueda} em queda` : `${alunos.length} alunos`} semMargem>
      {alunos.map((aluno) => (
        <View key={aluno.alunoId}>
          <Pressable
            onPress={() => navigation.navigate('RegistrarGraduacao', { alunoId: aluno.alunoId, nomeAluno: aluno.nome })}
            accessibilityRole="button"
            accessibilityLabel={`${aluno.nome}${aluno.faixaOuGrau ? `, ${aluno.faixaOuGrau}` : ''}${aluno.quedaFrequencia ? ', queda de frequência' : ''}. Registrar graduação`}
            style={({ pressed }) => pressed && styles.pressionada}
          >
            <CartaoAluno
              nome={aluno.nome}
              faixaOuGrau={aluno.faixaOuGrau}
              frequenciaRecente={aluno.frequenciaRecente}
              alerta={aluno.quedaFrequencia ? 'Queda de frequência' : undefined}
            />
          </Pressable>
        </View>
      ))}
      </GrupoLista>
    </Tela>
  );
}

const useEstilos = criarEstilos((c) => ({
  intro: { marginBottom: Espacamento.padrao, marginHorizontal: Espacamento.padrao },
  pressionada: { backgroundColor: c.preenchimento },
}));
