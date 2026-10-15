// Textura de lona de ringue (trama diagonal SVG) para fundos de destaque — BandaIdentidade e
// HeroCheckIn. Decorativa: fora da árvore de acessibilidade e sem interceptar toque.
//
// Dois ajustes do relatório (§4.4): o id do <Pattern> é único por instância (useId) — antes era
// "lona" fixo e duas texturas na mesma página web colidiam; e as props de acessibilidade ficam num
// View envoltório (`aria-hidden`), não no <Svg>, que repassava `accessibilityElementsHidden` ao
// DOM e gerava o warning "React does not recognize the prop".
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { Cores } from '../../theme';

interface TexturaLonaProps {
  opacidade?: number;
  cor?: string;
}

export default function TexturaLona({ opacidade = 0.06, cor = Cores.texto }: TexturaLonaProps) {
  const id = `lona-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <View style={[StyleSheet.absoluteFill, styles.camada]} aria-hidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={16} height={16} patternUnits="userSpaceOnUse">
            <Path d="M0,16 L16,0" stroke={cor} strokeWidth={1} opacity={opacidade} />
            <Path d="M-4,4 L4,-4" stroke={cor} strokeWidth={1} opacity={opacidade} />
            <Path d="M12,20 L20,12" stroke={cor} strokeWidth={1} opacity={opacidade} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  camada: { pointerEvents: 'none' },
});
