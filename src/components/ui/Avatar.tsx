// Avatar circular — foto quando existir (Usuario.fotoUrl), iniciais do nome como fallback.
import { Image, StyleSheet, Text, View } from 'react-native';
import { Cores } from '../../theme';

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
  const estiloTamanho = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };

  if (fotoUrl) {
    return (
      <Image
        source={{ uri: fotoUrl }}
        style={[styles.imagem, estiloTamanho]}
        accessibilityRole="image"
        accessibilityLabel={`Foto de ${nome}`}
      />
    );
  }

  return (
    <View style={[styles.iniciais, estiloTamanho]} accessibilityRole="image" accessibilityLabel={`Iniciais de ${nome}`}>
      <Text style={[styles.textoIniciais, { fontSize: tamanho * 0.4 }]}>{iniciais(nome)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imagem: { backgroundColor: Cores.cinzaFundo },
  iniciais: { backgroundColor: Cores.cinzaEscuro, alignItems: 'center', justifyContent: 'center' },
  textoIniciais: { color: Cores.branco, fontWeight: '600' },
});
