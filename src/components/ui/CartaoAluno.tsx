// CartaoAluno — linha de aluno na lista do gestor (RF24): avatar, nome, faixa e frequência
// recente. `alerta` (RF32) sinaliza queda de frequência com ícone + texto (não só cor).
import { StyleSheet, View } from 'react-native';
import { Alturas, Cores, Espacamento } from '../../theme';
import { IconeAlerta } from '../icones';
import Avatar from './Avatar';
import SeloFaixa from './SeloFaixa';
import IndicadorFrequencia from './IndicadorFrequencia';
import Texto from './Texto';

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
      <Avatar nome={nome} fotoUrl={fotoUrl} tamanho={44} />
      <View style={styles.textos}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {nome}
        </Texto>
        {faixaOuGrau ? <SeloFaixa faixaOuGrau={faixaOuGrau} /> : null}
        {alerta ? (
          <View style={styles.alerta}>
            <IconeAlerta tamanho={14} cor={Cores.perigo} />
            <Texto variante="legenda" cor="perigo">
              {alerta}
            </Texto>
          </View>
        ) : null}
      </View>
      <IndicadorFrequencia presencas={frequenciaRecente} />
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: Alturas.botaoHero + 16, paddingVertical: Espacamento.medio },
  textos: { flex: 1, gap: Espacamento.minimo },
  alerta: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.minimo },
});
