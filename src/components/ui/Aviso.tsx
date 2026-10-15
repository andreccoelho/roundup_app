// Aviso (toast) — mensagem temporária fixa na viewport (não no fim do conteúdo rolado): a tela
// passa o Aviso em `<Tela sobreposicao={...}>`. Variantes sucesso/erro/info com filete lateral e
// ícone. Entra deslizando (direto, com reduce motion). Respeita o inset inferior.
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cores, DuracaoAnimacao, Espacamento, LarguraMaxima, Raios } from '../../theme';
import { DRIVER_NATIVO } from '../../utils/animacao';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { IconeAlerta, IconeCheck, IconeSino } from '../icones';
import Texto from './Texto';

export type TipoAviso = 'sucesso' | 'erro' | 'info';

interface AvisoProps {
  mensagem: string;
  tipo?: TipoAviso;
  visivel: boolean;
  onFechar: () => void;
  duracaoMs?: number;
  // Distância extra da base — telas dentro das abas já têm a tab bar abaixo.
  acimaDaTabBar?: boolean;
}

const COR: Record<TipoAviso, string> = { sucesso: Cores.sucesso, erro: Cores.perigo, info: Cores.texto2 };
const ICONE = { sucesso: IconeCheck, erro: IconeAlerta, info: IconeSino };

export default function Aviso({ mensagem, tipo = 'info', visivel, onFechar, duracaoMs = 3000, acimaDaTabBar }: AvisoProps) {
  const insets = useSafeAreaInsets();
  const reduzido = useMovimentoReduzido();
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visivel) return;
    entrada.setValue(reduzido ? 1 : 0);
    if (!reduzido) Animated.timing(entrada, { toValue: 1, duration: DuracaoAnimacao.base, useNativeDriver: DRIVER_NATIVO }).start();
    const temporizador = setTimeout(onFechar, duracaoMs);
    return () => clearTimeout(temporizador);
  }, [visivel, duracaoMs, onFechar, reduzido, entrada]);

  if (!visivel) return null;
  const Icone = ICONE[tipo];

  return (
    <View style={[styles.camada, { bottom: (acimaDaTabBar ? 0 : insets.bottom) + Espacamento.padrao }]}>
      <Animated.View
        style={[
          styles.aviso,
          { borderLeftColor: COR[tipo] },
          { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Icone tamanho={20} cor={COR[tipo]} />
        <Texto variante="corpo" style={styles.texto}>
          {mensagem}
        </Texto>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  camada: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: Espacamento.padrao, pointerEvents: 'box-none' },
  aviso: {
    width: '100%',
    maxWidth: LarguraMaxima.formulario,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    backgroundColor: Cores.superficie2,
    borderRadius: Raios.pequeno,
    borderLeftWidth: 3,
    paddingVertical: Espacamento.medio,
    paddingHorizontal: Espacamento.padrao,
  },
  texto: { flex: 1 },
});
