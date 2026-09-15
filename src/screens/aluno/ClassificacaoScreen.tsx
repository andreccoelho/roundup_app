// RF20, RN09: classificação do escopo do aluno (primeiro vínculo ativo — sem seletor de
// escopo ainda, ver docs/DECISOES_PENDENTES.md item 7). RNF11 (adesão opcional) e RN04 (janela
// de tempo) não estão implementadas nesta rodada — ver docs/DECISOES_PENDENTES.md item 4.
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarResponsaveisAtivosDoAluno } from '../../services/vinculos';
import { listarClassificacao } from '../../services/classificacoes';
import { buscarUsuario } from '../../services/usuarios';
import { JANELA_RANKING } from '../../config/gamificacao';
import LinhaClassificacao from '../../components/ui/LinhaClassificacao';
import LinhaFina from '../../components/LinhaFina';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

interface LinhaComNome {
  alunoId: string;
  nome: string;
  pontos: number;
}

export default function ClassificacaoScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaComNome[]>([]);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const responsaveis = await listarResponsaveisAtivosDoAluno(usuario.id);
      const responsavelId = responsaveis[0];
      if (!responsavelId) {
        setLinhas([]);
        return;
      }

      const classificacao = await listarClassificacao(responsavelId);
      const comNome = await Promise.all(
        classificacao.map(async (c) => {
          if (c.alunoId === usuario.id) return { alunoId: c.alunoId, nome: usuario.nome, pontos: c.pontos };
          const aluno = await buscarUsuario(c.alunoId);
          return { alunoId: c.alunoId, nome: aluno?.nome ?? 'Aluno', pontos: c.pontos };
        }),
      );
      setLinhas(comNome);
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
        <Esqueleto altura={48} repeticoes={6} />
      </View>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  if (linhas.length === 0) {
    return (
      <View style={styles.container}>
        <EstadoVazio
          titulo="Ainda sem classificação"
          descricao="Faça check-in nos seus treinos para começar a pontuar."
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.legendaJanela}>Ranking {JANELA_RANKING}</Text>
      {linhas.map((linha, i) => (
        <View key={linha.alunoId}>
          <LinhaClassificacao
            posicao={i + 1}
            nome={linha.nome}
            pontos={linha.pontos}
            destaque={linha.alunoId === usuario?.id}
          />
          {i < linhas.length - 1 && <LinhaFina />}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
  legendaJanela: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginBottom: Espacamento.medio, textTransform: 'capitalize' },
});
