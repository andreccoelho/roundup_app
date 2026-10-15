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
import Podio from '../../components/ui/Podio';
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

  // script.md, item 4: top 3 vira pódio (2º-1º-3º, avatar maior), não só mais 3 linhas
  // numeradas — o resto da lista (4ª posição em diante) continua LinhaClassificacao normal.
  const top3 = linhas.slice(0, 3);
  const resto = linhas.slice(3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.legendaJanela}>Ranking {JANELA_RANKING}</Text>

      {top3.length > 0 ? (
        <Podio
          primeiro={{ posicao: 1, nome: top3[0].nome, pontos: top3[0].pontos, destaque: top3[0].alunoId === usuario?.id }}
          segundo={
            top3[1]
              ? { posicao: 2, nome: top3[1].nome, pontos: top3[1].pontos, destaque: top3[1].alunoId === usuario?.id }
              : undefined
          }
          terceiro={
            top3[2]
              ? { posicao: 3, nome: top3[2].nome, pontos: top3[2].pontos, destaque: top3[2].alunoId === usuario?.id }
              : undefined
          }
        />
      ) : null}

      {resto.length > 0 ? <LinhaFina /> : null}

      {resto.map((linha, i) => (
        <View key={linha.alunoId}>
          <LinhaClassificacao
            posicao={i + 4}
            nome={linha.nome}
            pontos={linha.pontos}
            destaque={linha.alunoId === usuario?.id}
          />
          {i < resto.length - 1 && <LinhaFina />}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
  legendaJanela: { fontSize: TamanhoFonte.sm, color: Cores.texto2, marginBottom: Espacamento.medio, textTransform: 'capitalize' },
});
