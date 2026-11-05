// Avatar circular — foto quando existir (Usuario.fotoUrl), iniciais do nome como fallback, sobre
// `preenchimento`, como os contatos do iOS.
import { Image, Text, View } from 'react-native';
import { criarEstilos } from '../../theme';

interface AvatarProps {
  nome: string;
  fotoUrl?: string;
  tamanho?: number;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export default function Avatar({ nome, fotoUrl, tamanho = 40 }: AvatarProps) {
  const styles = useEstilos();
  const estiloTamanho = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };

  if (fotoUrl) {
    return (
      <Image
        source={{ uri: fotoUrl }}
        style={[styles.fundo, estiloTamanho]}
        accessibilityRole="image"
        accessibilityLabel={`Foto de ${nome}`}
      />
    );
  }

  return (
    <View style={[styles.fundo, styles.iniciais, estiloTamanho]} accessibilityRole="image" accessibilityLabel={`Iniciais de ${nome}`}>
      <Text style={[styles.textoIniciais, { fontSize: tamanho * 0.4 }]} maxFontSizeMultiplier={1}>
        {iniciais(nome)}
      </Text>
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  fundo: { backgroundColor: c.preenchimento },
  iniciais: { alignItems: 'center', justifyContent: 'center' },
  textoIniciais: { color: c.texto2, fontWeight: '600' },
}));
