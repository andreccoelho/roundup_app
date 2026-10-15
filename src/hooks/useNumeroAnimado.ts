// Número que "sobe" até o valor (contador de XP, placares). Com reduce motion, entrega o valor
// final direto. Retorna o número atual (inteiro) para renderizar e o Animated.Value de 0 a 1 do
// progresso, útil para animar barras em sincronia.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { DuracaoAnimacao } from '../theme';
import { useMovimentoReduzido } from './useMovimentoReduzido';

export function useNumeroAnimado(valor: number, duracao: number = DuracaoAnimacao.contador): number {
  const reduzido = useMovimentoReduzido();
  const animado = useRef(new Animated.Value(0)).current;
  const [atual, setAtual] = useState(reduzido ? valor : 0);

  useEffect(() => {
    if (reduzido) {
      setAtual(valor);
      return;
    }
    const id = animado.addListener(({ value }) => setAtual(Math.round(value)));
    Animated.timing(animado, { toValue: valor, duration: duracao, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => animado.removeListener(id);
  }, [valor, duracao, reduzido, animado]);

  return atual;
}
