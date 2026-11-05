// CartaoSessao — linha de sessão (turma, horário, estado de check-in) para Agenda e "próximos
// treinos", dentro de um GrupoLista. Horário em número tabular à esquerda quando `inicio` é
// passado; o estado aparece uma vez só, no BotaoCheckIn à direita (RELATORIO_UI_UX.md, UI-16).
import { View } from 'react-native';
import { Alturas, criarEstilos, Espacamento } from '../../theme';
import type { EstadoCheckIn } from '../../utils/statusCheckIn';
import { formatarHora, rotuloDia } from '../../utils/apresentacao';
import BotaoCheckIn from './BotaoCheckIn';
import Texto from './Texto';

interface CartaoSessaoProps {
  nomeTurma: string;
  detalhe?: string;
  inicio?: Date;
  estado: EstadoCheckIn;
  motivo?: string;
  carregando?: boolean;
  onCheckIn?: () => void;
}

export default function CartaoSessao({ nomeTurma, detalhe, inicio, estado, motivo, carregando, onCheckIn }: CartaoSessaoProps) {
  const styles = useEstilos();
  return (
    <View style={styles.linha}>
      {inicio ? (
        <View style={styles.horario} accessible accessibilityLabel={`${rotuloDia(inicio)} às ${formatarHora(inicio)}`}>
          <Texto variante="headline" style={styles.tabular}>
            {formatarHora(inicio)}
          </Texto>
          <Texto variante="footnote" numberOfLines={1}>
            {rotuloDia(inicio)}
          </Texto>
        </View>
      ) : null}
      <View style={styles.textos}>
        <Texto variante="body" numberOfLines={2}>
          {nomeTurma}
        </Texto>
        {detalhe ? <Texto variante="footnote">{detalhe}</Texto> : null}
      </View>
      <BotaoCheckIn estado={estado} motivo={motivo} carregando={carregando} onPress={onCheckIn} />
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Alturas.linha + 16,
    paddingVertical: Espacamento.pequeno + 2,
    paddingHorizontal: Espacamento.padrao,
    gap: Espacamento.medio,
  },
  horario: { width: 64 },
  tabular: { fontVariant: ['tabular-nums'] },
  textos: { flex: 1, gap: 2 },
}));
