// Estatistica — número de placar (Oswald) + rótulo de placar em caixa alta. Usada nos perfis
// (nível/sequência/treinos) e nos contadores dos gestores, que antes usavam a fonte do sistema.
import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento, type NomeCor } from '../../theme';
import Texto from './Texto';

interface EstatisticaProps {
  valor: string | number;
  rotulo: string;
  tamanho?: 'normal' | 'grande';
  alinhamento?: 'inicio' | 'centro';
  cor?: NomeCor;
  icone?: ComponentType<{ tamanho?: number; cor?: string }>;
}

export default function Estatistica({ valor, rotulo, tamanho = 'normal', alinhamento = 'inicio', cor = 'texto', icone: Icone }: EstatisticaProps) {
  return (
    <View
      style={[styles.container, alinhamento === 'centro' && styles.centro]}
      accessible
      accessibilityLabel={`${rotulo}: ${valor}`}
    >
      <View style={styles.valorLinha}>
        {Icone ? <Icone tamanho={tamanho === 'grande' ? 28 : 18} cor={Cores.texto2} /> : null}
        <Texto variante={tamanho === 'grande' ? 'placarGrande' : 'placar'} cor={cor}>
          {String(valor)}
        </Texto>
      </View>
      <Texto variante="rotuloPlacar">{rotulo}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 2 },
  centro: { alignItems: 'center' },
  valorLinha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.minimo + 2 },
});
