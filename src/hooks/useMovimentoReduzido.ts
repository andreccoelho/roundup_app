// Reduce motion do sistema (iOS "Reduzir movimento", Android "Remover animações", web
// prefers-reduced-motion). Toda animação do app consulta este hook e, quando ligado, vai direto
// ao estado final (docs/DESIGN.md, Motion).
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useMovimentoReduzido(): boolean {
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((valor) => {
        if (ativo) setReduzido(valor);
      })
      .catch(() => {});
    const assinatura = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzido);
    return () => {
      ativo = false;
      assinatura?.remove();
    };
  }, []);

  return reduzido;
}
