// Logo do RoundUp (ringue com o lettering RNDP) na versão que contrasta com o tema: escura sobre
// fundo claro, invertida sobre fundo escuro. Decorativo por padrão — quem precisa de nome
// acessível passa `rotulo`.
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { useTema } from '../theme';

interface LogoProps {
  tamanho?: number;
  rotulo?: string;
  style?: StyleProp<ImageStyle>;
}

export default function Logo({ tamanho = 96, rotulo, style }: LogoProps) {
  const { escuro } = useTema();
  return (
    <Image
      source={escuro ? require('../../assets/roundup_logo_invertida.png') : require('../../assets/roundup_logo.png')}
      style={[{ width: tamanho, height: tamanho }, style]}
      resizeMode="contain"
      accessible={Boolean(rotulo)}
      accessibilityRole={rotulo ? 'image' : undefined}
      accessibilityLabel={rotulo}
    />
  );
}
