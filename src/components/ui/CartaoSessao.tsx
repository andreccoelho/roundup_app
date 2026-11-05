// CartaoSessao — linha de sessão (turma, horário, estado de check-in) para Agenda e "próximos
// treinos". Linha sobre o fundo (sem card). O horário vira bloco de placar à esquerda quando
// `inicio` é passado; o estado aparece uma vez só, no BotaoCheckIn à direita (antes o ícone de
// estado era desenhado duas vezes — RELATORIO_UI_UX.md, UI-16).
import { StyleSheet, View } from 'react-native';
import { Alturas, Espacamento } from '../../theme';
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
  return (
    <View style={styles.linha}>
      {inicio ? (
        <View style={styles.horario} accessible accessibilityLabel={`${rotuloDia(inicio)} às ${formatarHora(inicio)}`}>
          <Texto variante="numero">{formatarHora(inicio)}</Texto>
          <Texto variante="caption" cor="texto3" numberOfLines={1}>
            {rotuloDia(inicio)}
          </Texto>
        </View>
      ) : null}
      <View style={styles.textos}>
        <Texto variante="headline" numberOfLines={2}>
          {nomeTurma}
        </Texto>
        {detalhe ? <Texto variante="subheadline">{detalhe}</Texto> : null}
      </View>
      <BotaoCheckIn estado={estado} motivo={motivo} carregando={carregando} onPress={onCheckIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', minHeight: Alturas.botaoHero + 8, paddingVertical: Espacamento.medio, gap: Espacamento.medio },
  horario: { width: 76 },
  textos: { flex: 1, gap: 2 },
});
