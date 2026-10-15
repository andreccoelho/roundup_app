// Aviso (toast) — mensagem temporária no rodapé da tela, sem bloquear interação.
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, Raios, TamanhoFonte } from '../../theme';

interface AvisoProps {
  mensagem: string;
  tipo?: 'padrao' | 'erro';
  visivel: boolean;
  onFechar: () => void;
  duracaoMs?: number;
}

export default function Aviso({ mensagem, tipo = 'padrao', visivel, onFechar, duracaoMs = 2500 }: AvisoProps) {
  useEffect(() => {
    if (!visivel) return;
    const temporizador = setTimeout(onFechar, duracaoMs);
    return () => clearTimeout(temporizador);
  }, [visivel, duracaoMs, onFechar]);

  if (!visivel) return null;

  return (
    <View style={[styles.aviso, tipo === 'erro' && styles.avisoErro]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.texto}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    position: 'absolute',
    left: Espacamento.padrao,
    right: Espacamento.padrao,
    bottom: Espacamento.grande,
    backgroundColor: Cores.superficie2,
    borderRadius: Raios.pequeno,
    padding: Espacamento.padrao,
  },
  avisoErro: { backgroundColor: Cores.perigo },
  texto: { color: Cores.texto, fontSize: TamanhoFonte.sm, textAlign: 'center' },
});
