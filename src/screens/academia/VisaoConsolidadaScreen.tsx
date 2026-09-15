// RF27: visão consolidada da academia — turmas, professores, alunos (mesma base de
// academia/DashboardScreen.tsx) + indicador agregado de frequência (RF26/RF24 compostos em
// src/services/frequencia.ts). Sem coleção nem regra nova, ver docs/PLANO_REGRAS_CICLO2_3.md.
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarTurmasPorResponsavel } from '../../services/turmas';
import { listarVinculosAceitosDaAcademia } from '../../services/vinculos';
import { listarAlunosComFrequencia } from '../../services/frequencia';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoErro from '../../components/ui/EstadoErro';

function frequenciaMedia(alunos: { frequenciaRecente: boolean[] }[]): number | null {
  const todas = alunos.flatMap((a) => a.frequenciaRecente);
  if (todas.length === 0) return null;
  return Math.round((todas.filter(Boolean).length / todas.length) * 100);
}

export default function VisaoConsolidadaScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmasAtivas, setTurmasAtivas] = useState(0);
  const [professores, setProfessores] = useState(0);
  const [alunosVinculados, setAlunosVinculados] = useState(0);
  const [frequencia, setFrequencia] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [turmas, vinculosProfessores, vinculosAlunos, alunosComFrequencia] = await Promise.all([
        listarTurmasPorResponsavel(usuario.id),
        listarVinculosAceitosDaAcademia(usuario.id, 'professor'),
        listarVinculosAceitosDaAcademia(usuario.id, 'aluno'),
        listarAlunosComFrequencia(usuario.id),
      ]);
      setTurmasAtivas(turmas.filter((t) => t.ativa).length);
      setProfessores(vinculosProfessores.length);
      setAlunosVinculados(vinculosAlunos.length);
      setFrequencia(frequenciaMedia(alunosComFrequencia));
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
        <Esqueleto altura={64} repeticoes={2} />
      </View>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.contadoresLinha}>
        <View style={styles.contadorItem}>
          <Text style={styles.contadorValor}>{turmasAtivas}</Text>
          <Text style={styles.contadorRotulo}>turmas ativas</Text>
        </View>
        <View style={styles.contadorItem}>
          <Text style={styles.contadorValor}>{professores}</Text>
          <Text style={styles.contadorRotulo}>professores</Text>
        </View>
        <View style={styles.contadorItem}>
          <Text style={styles.contadorValor}>{alunosVinculados}</Text>
          <Text style={styles.contadorRotulo}>alunos</Text>
        </View>
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Frequência recente</Text>
        {frequencia === null ? (
          <Text style={styles.vazio}>Sem check-ins recentes para calcular frequência.</Text>
        ) : (
          <>
            <Text style={styles.frequenciaValor}>{frequencia}%</Text>
            <Text style={styles.frequenciaDetalhe}>
              dos últimos check-ins de alunos matriculados foram validados
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
  contadoresLinha: { flexDirection: 'row', gap: Espacamento.grande },
  contadorItem: { flex: 1 },
  contadorValor: { fontSize: TamanhoFonte.xxl, fontWeight: '700', color: Cores.preto },
  contadorRotulo: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: 2 },
  secao: { marginTop: Espacamento.grande },
  secaoTitulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.preto, marginBottom: Espacamento.pequeno },
  vazio: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm },
  frequenciaValor: { fontSize: TamanhoFonte.xxl, fontWeight: '700', color: Cores.preto },
  frequenciaDetalhe: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: 2 },
});
