// CartaoMissao — missão ativa com progresso parcial (RF18, Ciclo 2). Sem consumidor real
// ainda: `missoes`/`missoesProgresso` seguem bloqueados em firestore.rules.
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, Raios, TamanhoFonte } from '../../theme';
import Cartao from './Cartao';

interface CartaoMissaoProps {
  titulo: string;
  descricao: string;
  progressoAtual: number;
  meta: number;
  concluida?: boolean;
}

export default function CartaoMissao({ titulo, descricao, progressoAtual, meta, concluida }: CartaoMissaoProps) {
  const progresso = meta > 0 ? Math.min(1, progressoAtual / meta) : 0;

  return (
    <Cartao
      accessibilityRole="summary"
      accessibilityLabel={`${titulo}, ${progressoAtual} de ${meta}${concluida ? ', concluída' : ''}`}
    >
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>{titulo}</Text>
        {concluida ? <Text style={styles.selo}>Concluída</Text> : null}
      </View>
      <Text style={styles.descricao}>{descricao}</Text>
      <View style={styles.trilha}>
        <View style={[styles.preenchimento, { width: `${progresso * 100}%` }]} />
      </View>
      <Text style={styles.progressoTexto}>
        {progressoAtual} / {meta}
      </Text>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.preto, flexShrink: 1 },
  selo: { fontSize: TamanhoFonte.xs, color: Cores.checkinValidado, fontWeight: '600' },
  descricao: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
  trilha: { height: 6, borderRadius: Raios.pequeno, backgroundColor: Cores.cinzaFundo, overflow: 'hidden', marginTop: Espacamento.pequeno },
  preenchimento: { height: '100%', backgroundColor: Cores.preto, borderRadius: Raios.pequeno },
  progressoTexto: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
});
