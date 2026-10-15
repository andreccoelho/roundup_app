// RF24: alunos sob responsabilidade do gestor, com frequência recente. Toca num aluno para
// registrar graduação (RF25). RF32: sinaliza queda de frequência (critério provisório em
// src/config/gamificacao.ts) reaproveitando CartaoAluno — sem tela nem componente novos.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Cores, Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarAlunosComFrequencia, AlunoComFrequencia } from '../../services/frequencia';
import { AlunosStackParamList } from '../../navigation/GestorTabsCompartilhado';
import CartaoAluno from '../../components/ui/CartaoAluno';
import LinhaFina from '../../components/LinhaFina';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import { IconeFaixa } from '../../components/icones';
import { mensagemErro } from '../../utils/mensagensErro';

export default function AlunosScreen() {
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
      <Tela largura="lista">
        <Esqueleto forma="linha" repeticoes={6} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  if (alunos.length === 0) {
    return (
      <Tela largura="lista" centralizarVertical>
        <EstadoVazio icone={IconeFaixa} titulo="Nenhum aluno matriculado" descricao="Alunos aparecem aqui assim que se matricularem em uma turma sua." />
      </Tela>
    );
  }

  const emQueda = alunos.filter((a) => a.quedaFrequencia).length;

  return (
    <Tela largura="lista">
      <Texto variante="legenda" style={styles.intro}>
        Toque num aluno para registrar graduação. As marcas mostram as últimas presenças.
      </Texto>
      <CabecalhoSecao titulo="Alunos" contador={emQueda > 0 ? `${alunos.length}, ${emQueda} em queda` : alunos.length} semMargem />
      {alunos.map((aluno, i) => (
        <View key={aluno.alunoId}>
          {i > 0 ? <LinhaFina /> : null}
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
    </Tela>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: Espacamento.padrao },
  pressionada: { backgroundColor: Cores.superficie1 },
});
