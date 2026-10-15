// RF24: alunos sob responsabilidade do gestor, com frequência recente. Toca num aluno para
// registrar graduação (RF25). RF32: sinaliza queda de frequência (critério provisório em
// src/config/gamificacao.ts) reaproveitando CartaoAluno — sem tela nem componente novos.
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <View style={styles.container}>
        <Esqueleto altura={64} repeticoes={5} />
      </View>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  if (alunos.length === 0) {
    return (
      <View style={styles.container}>
        <EstadoVazio titulo="Nenhum aluno matriculado" descricao="Alunos aparecem aqui assim que se matricularem em uma turma sua." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {alunos.map((aluno, i) => (
        <View key={aluno.alunoId}>
          <TouchableOpacity
            onPress={() => navigation.navigate('RegistrarGraduacao', { alunoId: aluno.alunoId, nomeAluno: aluno.nome })}
            accessibilityRole="button"
            accessibilityLabel={`Registrar graduação de ${aluno.nome}`}
          >
            <CartaoAluno
              nome={aluno.nome}
              faixaOuGrau={aluno.faixaOuGrau}
              frequenciaRecente={aluno.frequenciaRecente}
              alerta={aluno.quedaFrequencia ? 'Queda de frequência' : undefined}
            />
          </TouchableOpacity>
          {i < alunos.length - 1 && <LinhaFina />}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
});
