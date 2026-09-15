// script.md, item 1: "textura sutil de lona de ringue (canvas) como fundo em telas-chave (home,
// perfil), sem prejudicar legibilidade". Sem asset de imagem — trama diagonal gerada via
// react-native-svg (já no projeto, sem lib nova), opacidade bem baixa por padrão. Decorativo:
// não entra na árvore de acessibilidade nem intercepta toque (fica atrás do conteúdo real).
import { StyleSheet } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { Cores } from '../../theme';

interface TexturaLonaProps {
  opacidade?: number;
}

export default function TexturaLona({ opacidade = 0.05 }: TexturaLonaProps) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <Pattern id="lona" width={16} height={16} patternUnits="userSpaceOnUse">
          <Path d="M0,16 L16,0" stroke={Cores.preto} strokeWidth={1} opacity={opacidade} />
          <Path d="M-4,4 L4,-4" stroke={Cores.preto} strokeWidth={1} opacity={opacidade} />
          <Path d="M12,20 L20,12" stroke={Cores.preto} strokeWidth={1} opacity={opacidade} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#lona)" />
    </Svg>
  );
}
