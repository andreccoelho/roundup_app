// Textura de lona de ringue (trama diagonal SVG), de volta da direção "Noite de luta" em versão
// por tema: a trama usa a cor de texto do tema atual em opacidade baixa, então aparece como
// grão escuro no claro e grão claro no escuro. Usada no FundoIdentidade, no HeroCheckIn e no
// MomentoConquista. Decorativa: fora da árvore de acessibilidade e sem interceptar toque.
//
// O id do <Pattern> é único por instância (useId), para duas texturas na mesma página web não
// colidirem; as props de acessibilidade ficam no View envoltório, não no <Svg>.
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { useTema } from '../../theme';

interface TexturaLonaProps {
  opacidade?: number;
  cor?: string;
}

export default function TexturaLona({ opacidade, cor }: TexturaLonaProps) {
  const { cores, escuro } = useTema();
  const id = `lona-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const traco = cor ?? cores.texto;
  // No claro o traço preto pesa mais que o branco no escuro: opacidade padrão menor
  const alfa = opacidade ?? (escuro ? 0.07 : 0.045);
  return (
    <View style={[StyleSheet.absoluteFill, styles.camada]} aria-hidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={16} height={16} patternUnits="userSpaceOnUse">
            <Path d="M0,16 L16,0" stroke={traco} strokeWidth={1} opacity={alfa} />
            <Path d="M-4,4 L4,-4" stroke={traco} strokeWidth={1} opacity={alfa} />
            <Path d="M12,20 L20,12" stroke={traco} strokeWidth={1} opacity={alfa} />
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
