// RF18: missões ativas no escopo do vínculo do aluno, com progresso parcial. Progresso só
// existe depois que o responsável cria a missão e passa a marcar progresso (RF23 ainda não tem
// tela — ver docs/DECISOES_PENDENTES.md item 2); até lá, toda missão aparece com progresso zero.
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarResponsaveisAtivosDoAluno } from '../../services/vinculos';
import { listarMissoesAtivasDoResponsavel, listarProgressoPorAluno } from '../../services/missoes';
import { Missao, MissaoProgresso } from '../../types';
import CartaoMissao from '../../components/ui/CartaoMissao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

interface ItemMissao {
  missao: Missao;
  progresso: MissaoProgresso | null;
}

export default function MissoesScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemMissao[]>([]);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const responsaveis = await listarResponsaveisAtivosDoAluno(usuario.id);
      const responsavelId = responsaveis[0];
      if (!responsavelId) {
        setItens([]);
        return;
      }

      const [missoes, progresso] = await Promise.all([
        listarMissoesAtivasDoResponsavel(responsavelId),
        listarProgressoPorAluno(usuario.id),
      ]);
      const progressoPorMissao = new Map(progresso.map((p) => [p.missaoId, p]));
      setItens(missoes.map((missao) => ({ missao, progresso: progressoPorMissao.get(missao.id) ?? null })));
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
        <Esqueleto altura={96} repeticoes={3} />
      </View>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  if (itens.length === 0) {
    return (
      <View style={styles.container}>
        <EstadoVazio
          titulo="Nenhuma missão ativa"
          descricao="Quando seu professor ou academia publicar uma missão, ela aparece aqui."
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {itens.map(({ missao, progresso }) => (
        <View key={missao.id} style={styles.espacoCartao}>
          <CartaoMissao
            titulo={missao.titulo}
            descricao={missao.descricao}
            progressoAtual={progresso?.progressoAtual ?? 0}
            meta={missao.meta}
            concluida={progresso?.concluida ?? false}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
  espacoCartao: { marginBottom: Espacamento.medio },
});
