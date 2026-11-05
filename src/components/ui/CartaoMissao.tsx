// CartaoMissao — missão com progresso (RF18), como linha de um GrupoLista: título, critério, barra
// contínua arredondada e a contagem "2 de 3". Concluída: barra cheia em sucesso + ✓ verde.
import { View } from 'react-native';
import { criarEstilos, Espacamento, useTema } from '../../theme';
import { IconeCheckCirculo } from '../icones';
import Texto from './Texto';

interface CartaoMissaoProps {
  titulo: string;
  descricao: string;
  progressoAtual: number;
  meta: number;
  concluida?: boolean;
  pontos?: number;
}

export default function CartaoMissao({ titulo, descricao, progressoAtual, meta, concluida, pontos }: CartaoMissaoProps) {
  const { cores } = useTema();
  const styles = useEstilos();
  const atual = Math.min(progressoAtual, meta);
  const progresso = concluida ? 1 : meta > 0 ? atual / meta : 0;

  return (
    <View
      style={styles.linha}
      accessible
      accessibilityLabel={`${titulo}. ${descricao}. ${progressoAtual} de ${meta}${concluida ? ', concluída' : ''}${pontos ? `, vale ${pontos} pontos` : ''}`}
    >
      <View style={styles.cabecalho}>
        <View style={styles.textos}>
          <Texto variante="headline">{titulo}</Texto>
          <Texto variante="footnote">{descricao}</Texto>
        </View>
        <View style={styles.placar}>
          {concluida ? (
            <IconeCheckCirculo tamanho={24} cor={cores.sucesso} preenchido />
          ) : (
            <Texto variante="subheadline" cor="texto" style={styles.tabular}>{`${atual} de ${meta}`}</Texto>
          )}
          {pontos ? <Texto variante="caption" style={styles.tabular}>{`+${pontos} XP`}</Texto> : null}
        </View>
      </View>
      <View style={styles.trilha} aria-hidden>
        <View style={[styles.cheio, { width: `${progresso * 100}%`, backgroundColor: concluida ? cores.sucesso : cores.tint }]} />
      </View>
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  linha: { paddingVertical: Espacamento.medio, paddingHorizontal: Espacamento.padrao },
  cabecalho: { flexDirection: 'row', gap: Espacamento.medio, alignItems: 'flex-start' },
  textos: { flex: 1, gap: 2 },
  placar: { alignItems: 'flex-end', gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
  trilha: { height: 6, borderRadius: 3, backgroundColor: c.preenchimento, overflow: 'hidden', marginTop: Espacamento.medio },
  cheio: { height: 6, borderRadius: 3 },
}));
