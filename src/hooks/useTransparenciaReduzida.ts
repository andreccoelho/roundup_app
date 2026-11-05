// "Reduzir transparência" do iOS (Acessibilidade > Tela e Tamanho do Texto). Ligado, os materiais
// translúcidos (tab bar com blur) viram superfícies sólidas. No Android e no web a API não existe e
// o valor fica false — o Android já usa superfície sólida por padrão (opcoesCasca.tsx). O
// react-native-web nem implementa a função: chamá-la lá derruba a árvore.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useTransparenciaReduzida(): boolean {
  const [reduzida, setReduzida] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    let ativo = true;
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((valor) => {
        if (ativo) setReduzida(valor);
      })
      .catch(() => {});
    const assinatura = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduzida);
    return () => {
      ativo = false;
      assinatura?.remove();
    };
  }, []);

  return reduzida;
}
