// RF27: visão consolidada da academia — turmas, professores, alunos (mesma base de
// academia/DashboardScreen.tsx) + indicador agregado de frequência (RF26/RF24 compostos em
// src/services/frequencia.ts). Sem coleção nem regra nova, ver docs/PLANO_REGRAS_CICLO2_3.md.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarTurmasPorResponsavel } from '../../services/turmas';
import { listarVinculosAceitosDaAcademia } from '../../services/vinculos';
import { listarAlunosComFrequencia } from '../../services/frequencia';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoErro from '../../components/ui/EstadoErro';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Cartao from '../../components/ui/Cartao';
import Estatistica from '../../components/ui/Estatistica';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import { mensagemErro } from '../../utils/mensagensErro';

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
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar a visão consolidada agora.'));
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
        <Esqueleto altura={72} repeticoes={2} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  return (
    <Tela largura="lista">
      <CabecalhoSecao titulo="Unidade" semMargem />
      <View style={styles.contadores}>
        <Estatistica valor={turmasAtivas} rotulo="Turmas ativas" tamanho="grande" />
        <Estatistica valor={professores} rotulo="Professores" tamanho="grande" />
        <Estatistica valor={alunosVinculados} rotulo="Alunos" tamanho="grande" />
      </View>

      <CabecalhoSecao titulo="Frequência recente" />
      {frequencia === null ? (
        <Texto variante="legenda">Sem check-ins recentes para calcular frequência.</Texto>
      ) : (
        <Cartao>
          <View style={styles.frequencia} accessible accessibilityLabel={`Frequência recente: ${frequencia}% dos últimos check-ins validados`}>
            <Texto variante="placarGrande">{`${frequencia}%`}</Texto>
            <Texto variante="legenda" style={styles.frequenciaTexto}>
              dos últimos check-ins de alunos matriculados foram validados
            </Texto>
          </View>
          <View style={styles.trilha} aria-hidden>
            <View style={styles.trilhaVazia} />
            <View style={[styles.trilhaCheia, { width: `${frequencia}%` }]} />
          </View>
        </Cartao>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  contadores: { flexDirection: 'row', gap: Espacamento.padrao },
  frequencia: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.padrao },
  frequenciaTexto: { flex: 1 },
  trilha: { height: 8, justifyContent: 'center', marginTop: Espacamento.padrao },
  trilhaVazia: { height: 2, backgroundColor: Cores.linhaForte },
  trilhaCheia: { position: 'absolute', left: 0, top: 0, height: 8, backgroundColor: Cores.texto },
});
