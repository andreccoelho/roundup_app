// RF18: missões ativas no escopo do vínculo do aluno, com progresso parcial. Progresso só
// existe depois que o responsável cria a missão e passa a marcar progresso (RF23 ainda não tem
// tela — ver docs/DECISOES_PENDENTES.md item 2); até lá, toda missão aparece com progresso zero.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarResponsaveisAtivosDoAluno } from '../../services/vinculos';
import { listarMissoesAtivasDoResponsavel, listarProgressoPorAluno } from '../../services/missoes';
import { Missao, MissaoProgresso } from '../../types';
import CartaoMissao from '../../components/ui/CartaoMissao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import Tela from '../../components/ui/Tela';
import Abas from '../../components/ui/Abas';
import LinhaFina from '../../components/LinhaFina';
import { IconeBandeira } from '../../components/icones';
import { mensagemErro } from '../../utils/mensagensErro';

interface ItemMissao {
  missao: Missao;
  progresso: MissaoProgresso | null;
}

export default function MissoesScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemMissao[]>([]);
  const [aba, setAba] = useState<'curso' | 'concluidas'>('curso');

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
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar suas missões agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const emCurso = itens.filter((i) => !i.progresso?.concluida);
  const concluidas = itens.filter((i) => i.progresso?.concluida);
  const visiveis = aba === 'curso' ? emCurso : concluidas;

  return (
    <Tela largura="lista">
      <Abas
        accessibilityLabel="Filtrar missões"
        opcoes={[
          { valor: 'curso', rotulo: `Em curso (${emCurso.length})` },
          { valor: 'concluidas', rotulo: `Concluídas (${concluidas.length})` },
        ]}
        selecionada={aba}
        onSelecionar={setAba}
      />

      {carregando ? (
        <View style={styles.topo}>
          <Esqueleto altura={72} repeticoes={3} />
        </View>
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentarNovamente={carregar} />
      ) : itens.length === 0 ? (
        <EstadoVazio
          icone={IconeBandeira}
          titulo="Nenhuma missão ativa"
          descricao="Quando seu professor ou academia publicar uma missão, ela aparece aqui."
        />
      ) : visiveis.length === 0 ? (
        <EstadoVazio
          icone={IconeBandeira}
          titulo={aba === 'curso' ? 'Tudo concluído' : 'Nenhuma missão concluída ainda'}
          descricao={aba === 'curso' ? 'Você fechou todas as missões ativas. Novas aparecem aqui.' : 'Complete uma missão em curso para ela aparecer aqui.'}
        />
      ) : (
        visiveis.map(({ missao, progresso }, i) => (
          <View key={missao.id}>
            {i > 0 ? <LinhaFina /> : null}
            <CartaoMissao
              titulo={missao.titulo}
              descricao={missao.descricao}
              progressoAtual={progresso?.progressoAtual ?? 0}
              meta={missao.meta}
              pontos={missao.pontos}
              concluida={progresso?.concluida ?? false}
            />
          </View>
        ))
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  topo: { marginTop: Espacamento.grande },
});
