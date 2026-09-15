// RF11: turmas dos responsáveis com quem o aluno tem vínculo ativo, com opção de matrícula
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarTurmasDisponiveisParaAluno, listarTurmasDoAluno } from '../../services/turmas';
import { matricularAluno } from '../../services/matriculas';
import { Turma } from '../../types';
import Cartao from '../../components/ui/Cartao';
import Botao from '../../components/ui/Botao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

export default function TurmasDisponiveisScreen() {
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [matriculadasIds, setMatriculadasIds] = useState<Set<string>>(new Set());
  const [matriculando, setMatriculando] = useState<string | null>(null);
  const [erroMatricula, setErroMatricula] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [disponiveis, matriculadas] = await Promise.all([
        listarTurmasDisponiveisParaAluno(usuario.id),
        listarTurmasDoAluno(usuario.id),
      ]);
      setTurmas(disponiveis);
      setMatriculadasIds(new Set(matriculadas.map((t) => t.id)));
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleMatricular(turmaId: string) {
    if (!usuario) return;
    setMatriculando(turmaId);
    setErroMatricula(null);
    try {
      await matricularAluno(turmaId, usuario.id);
      setMatriculadasIds((prev) => new Set(prev).add(turmaId));
    } catch (e: any) {
      setErroMatricula(e.message);
    } finally {
      setMatriculando(null);
    }
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <Esqueleto altura={72} repeticoes={4} />
      </View>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  if (turmas.length === 0) {
    return (
      <View style={styles.container}>
        <EstadoVazio
          titulo="Nenhuma turma disponível"
          descricao="Você precisa ter vínculo ativo com uma academia ou professor para ver turmas aqui."
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {erroMatricula ? (
        <Text style={styles.erroInline} accessibilityRole="alert">
          {erroMatricula}
        </Text>
      ) : null}

      {turmas.map((turma) => {
        const jaMatriculado = matriculadasIds.has(turma.id);
        return (
          <Cartao key={turma.id} style={styles.item}>
            <View style={styles.itemLinha}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemNome}>{turma.nome}</Text>
                <Text style={styles.itemDetalhe}>
                  {turma.modalidade} · {turma.nivel}
                </Text>
              </View>
              <Botao
                titulo={jaMatriculado ? 'Matriculado' : 'Matricular'}
                variante={jaMatriculado ? 'secundario' : 'primario'}
                desabilitado={jaMatriculado}
                carregando={matriculando === turma.id}
                onPress={() => handleMatricular(turma.id)}
              />
            </View>
          </Cartao>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
  erroInline: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.padrao },
  item: { marginBottom: Espacamento.pequeno },
  itemLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Espacamento.medio },
  itemInfo: { flex: 1 },
  itemNome: { fontSize: TamanhoFonte.md, fontWeight: '700', color: Cores.preto },
  itemDetalhe: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
});
