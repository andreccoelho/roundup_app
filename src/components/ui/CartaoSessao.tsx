// CartaoSessao — componente de domínio: linha de sessão (turma, horário, estado de check-in).
// Une o ícone líder de estado (antes só em aluno/DashboardScreen.tsx) com o BotaoCheckIn
// (trailing), reaproveitado por aluno/DashboardScreen.tsx e aluno/AgendaScreen.tsx.
import { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { EstadoCheckIn } from '../../utils/statusCheckIn';
import { IconeCadeado, IconeCheck, IconeLuva } from '../icones';
import BotaoCheckIn from './BotaoCheckIn';

interface CartaoSessaoProps {
  nomeTurma: string;
  detalhe: string;
  estado: EstadoCheckIn;
  motivo?: string;
  carregando?: boolean;
  onCheckIn?: () => void;
}

interface IconeEstadoProps {
  cor?: string;
  tamanho?: number;
}

const ICONE_POR_ESTADO: Record<EstadoCheckIn, ComponentType<IconeEstadoProps>> = {
  disponivel: IconeLuva,
  foraDaJanela: IconeCadeado,
  realizado: IconeCheck,
};

const COR_ICONE_POR_ESTADO: Record<EstadoCheckIn, string> = {
  disponivel: Cores.preto,
  foraDaJanela: Cores.alerta,
  realizado: Cores.checkinValidado,
};

export default function CartaoSessao({ nomeTurma, detalhe, estado, motivo, carregando, onCheckIn }: CartaoSessaoProps) {
  const Icone = ICONE_POR_ESTADO[estado];
  return (
    <View style={styles.linha}>
      <Icone cor={COR_ICONE_POR_ESTADO[estado]} tamanho={20} />
      <View style={styles.textos}>
        <Text style={styles.titulo}>{nomeTurma}</Text>
        <Text style={styles.detalhe}>{detalhe}</Text>
      </View>
      <BotaoCheckIn estado={estado} motivo={motivo} carregando={carregando} onPress={onCheckIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: Espacamento.medio, gap: Espacamento.medio },
  textos: { flex: 1 },
  titulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.preto },
  detalhe: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: 2 },
});
