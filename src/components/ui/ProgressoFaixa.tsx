// ProgressoFaixa — progresso até a próxima graduação (RF33), embaixo do selo da faixa no Perfil
// do aluno. Medido pelos graus da faixa atual (decisão de produto, docs/DECISOES_PENDENTES.md):
// "2º grau de 4 · próxima: Roxa". Faixa sem graus mostra só a próxima; a última faixa completa
// mostra "Última faixa". RN03: é só leitura do que o responsável registrou, nunca uma previsão.
import { View } from 'react-native';
import { criarEstilos, Espacamento, useTema } from '../../theme';
import type { ProgressoFaixa as Progresso } from '../../utils/faixas';
import Texto from './Texto';

interface ProgressoFaixaProps {
  progresso: Progresso;
}

export function textoProgressoFaixa({ grau, grausDaFaixa, proxima, posicao, total }: Progresso): string {
  const graus = grausDaFaixa > 0 ? `${grau}º grau de ${grausDaFaixa}` : null;
  const destino = proxima ? `próxima: ${proxima.nome}` : 'última faixa';
  return [graus, destino, `faixa ${posicao} de ${total}`].filter(Boolean).join(' · ');
}

export default function ProgressoFaixa({ progresso }: ProgressoFaixaProps) {
  const { cores } = useTema();
  const styles = useEstilos();
  const texto = textoProgressoFaixa(progresso);
  const cheia = progresso.fracao >= 1;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Progresso até a próxima graduação: ${texto}`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progresso.fracao * 100) }}
    >
      <View style={styles.trilha} aria-hidden>
        <View style={[styles.cheio, { width: `${Math.min(1, progresso.fracao) * 100}%`, backgroundColor: cheia ? cores.sucesso : cores.tint }]} />
      </View>
      <Texto variante="caption" cor="texto2" aria-hidden>
        {texto}
      </Texto>
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  container: { gap: Espacamento.minimo, marginTop: Espacamento.minimo, alignSelf: 'stretch' },
  trilha: { height: 6, borderRadius: 3, backgroundColor: c.preenchimento, overflow: 'hidden' },
  cheio: { height: 6, borderRadius: 3 },
}));
