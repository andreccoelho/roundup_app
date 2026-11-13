// RF18, RF23: missões de todos os responsáveis com quem o aluno tem vínculo, com progresso. A
// consulta já vem filtrada pelo servidor (leitoresIds): só missões vigentes do público-alvo do
// aluno e, depois do fim da vigência, só as que ele concluiu (ficam na aba "Concluídas").
// O progresso de presença/pontuação/sequência é atualizado por Cloud Function quando um check-in
// é validado; o de missão personalizada, quando o responsável marca a conclusão. Missão sem
// documento de progresso ainda aparece com progresso zero.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarMissoesDoAluno, listarProgressoPorAluno } from '../../services/missoes';
import { situacaoDaMissao, textoVigencia } from '../../utils/missoes';
import { Missao, MissaoProgresso } from '../../types';
import CartaoMissao from '../../components/ui/CartaoMissao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import Tela from '../../components/ui/Tela';
import Abas from '../../components/ui/Abas';
import GrupoLista from '../../components/ui/GrupoLista';
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
      const [missoes, progresso] = await Promise.all([listarMissoesDoAluno(usuario.id), listarProgressoPorAluno(usuario.id)]);
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

  // Entre o fim da vigência e o recálculo diário do servidor (00:05), a missão ainda pode vir na
  // consulta: o relógio do aparelho já a tira de "Em curso".
  const emCurso = itens.filter((i) => !i.progresso?.concluida && situacaoDaMissao(i.missao) === 'vigente');
  const concluidas = itens.filter((i) => i.progresso?.concluida);
  const visiveis = aba === 'curso' ? emCurso : concluidas;

  return (
    <Tela largura="lista" agrupada tituloGrande="Missões">
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
      ) : emCurso.length + concluidas.length === 0 ? (
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
        <GrupoLista>
          {visiveis.map(({ missao, progresso }) => (
            <CartaoMissao
              key={missao.id}
              titulo={missao.titulo}
              descricao={missao.descricao}
              progressoAtual={progresso?.progressoAtual ?? 0}
              meta={missao.meta}
              pontos={missao.pontos}
              concluida={progresso?.concluida ?? false}
              vigencia={textoVigencia(missao)}
            />
          ))}
        </GrupoLista>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  topo: { marginTop: Espacamento.grande },
});
