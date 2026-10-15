// CartaoAluno — nome, faixa, frequência recente (RF24). `alerta` (RF32, opcional) sinaliza
// queda de frequência — só um rótulo curto em Cores.perigo, sem nova variante visual.
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import Avatar from './Avatar';
import SeloFaixa from './SeloFaixa';
import IndicadorFrequencia from './IndicadorFrequencia';

interface CartaoAlunoProps {
  nome: string;
  faixaOuGrau?: string;
  fotoUrl?: string;
  frequenciaRecente: boolean[];
  alerta?: string;
}

export default function CartaoAluno({ nome, faixaOuGrau, fotoUrl, frequenciaRecente, alerta }: CartaoAlunoProps) {
  return (
    <View style={styles.linha}>
      <Avatar nome={nome} fotoUrl={fotoUrl} />
      <View style={styles.textos}>
        <Text style={styles.nome}>{nome}</Text>
        {faixaOuGrau ? <SeloFaixa faixaOuGrau={faixaOuGrau} /> : null}
        {alerta ? (
          <Text style={styles.alerta} accessibilityLabel={alerta}>
            {alerta}
          </Text>
        ) : null}
      </View>
      <IndicadorFrequencia presencas={frequenciaRecente} />
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, paddingVertical: Espacamento.pequeno },
  textos: { flex: 1, gap: Espacamento.minimo },
  nome: { fontSize: TamanhoFonte.md, color: Cores.texto, fontWeight: '600' },
  alerta: { fontSize: TamanhoFonte.xs, color: Cores.perigo, fontWeight: '600' },
});
