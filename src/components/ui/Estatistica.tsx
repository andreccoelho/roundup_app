// Estatistica — número em peso forte com algarismos tabulares + rótulo curto em Footnote, como os
// totais do app Fitness. Usada nos perfis (nível/sequência/treinos) e nos contadores dos gestores.
import type { ComponentType } from 'react';
import { View } from 'react-native';
import { criarEstilos, Espacamento, useTema, type NomeCor } from '../../theme';
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
  const styles = useEstilos();
  const { cores } = useTema();
  return (
    <View style={[styles.container, alinhamento === 'centro' && styles.centro]} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <View style={styles.valorLinha}>
        {Icone ? <Icone tamanho={tamanho === 'grande' ? 26 : 18} cor={cores.tint} /> : null}
        <Texto variante={tamanho === 'grande' ? 'numeroGrande' : 'numero'} cor={cor}>
          {String(valor)}
        </Texto>
      </View>
      <Texto variante="footnote">{rotulo}</Texto>
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  container: { flex: 1, gap: 2 },
  centro: { alignItems: 'center' },
  valorLinha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.minimo + 2 },
}));
