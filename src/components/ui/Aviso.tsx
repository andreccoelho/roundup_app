// Aviso (toast) — mensagem temporária fixa na viewport (não no fim do conteúdo rolado): a tela
// passa o Aviso em `<Tela sobreposicao={...}>`. Cápsula arredondada em superficieElevada com
// sombra suave e ícone colorido (sucesso/erro/info), como os banners do sistema. Entra com mola
// curta (direto, com reduce motion); erro dispara o haptic de aviso. Respeita o inset inferior.
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { criarEstilos, Espacamento, LarguraMaxima, Mola, useTema } from '../../theme';
import { DRIVER_NATIVO } from '../../utils/animacao';
import { hapticaAviso, hapticaSucesso } from '../../utils/haptica';
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

const ICONE = { sucesso: IconeCheck, erro: IconeAlerta, info: IconeSino };

export default function Aviso({ mensagem, tipo = 'info', visivel, onFechar, duracaoMs = 3000, acimaDaTabBar }: AvisoProps) {
  const insets = useSafeAreaInsets();
  const reduzido = useMovimentoReduzido();
  const { cores } = useTema();
  const styles = useEstilos();
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visivel) return;
    if (tipo === 'erro') hapticaAviso();
    if (tipo === 'sucesso') hapticaSucesso();
    entrada.setValue(reduzido ? 1 : 0);
    if (!reduzido) Animated.spring(entrada, { toValue: 1, ...Mola, useNativeDriver: DRIVER_NATIVO }).start();
    const temporizador = setTimeout(onFechar, duracaoMs);
    return () => clearTimeout(temporizador);
  }, [visivel, duracaoMs, onFechar, reduzido, entrada, tipo]);

  if (!visivel) return null;
  const Icone = ICONE[tipo];
  const cor = { sucesso: cores.sucesso, erro: cores.perigo, info: cores.tint }[tipo];

  return (
    <View style={[styles.camada, { bottom: (acimaDaTabBar ? 0 : insets.bottom) + Espacamento.padrao }]}>
      <Animated.View
        style={[
          styles.aviso,
          { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Icone tamanho={20} cor={cor} />
        <Texto variante="subheadline" cor="texto" style={styles.texto}>
          {mensagem}
        </Texto>
      </Animated.View>
    </View>
  );
}

const useEstilos = criarEstilos((c, escuro) => ({
  camada: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: Espacamento.padrao, pointerEvents: 'box-none' },
  aviso: {
    width: '100%',
    maxWidth: LarguraMaxima.formulario,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    backgroundColor: c.superficieElevada,
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingVertical: Espacamento.medio,
    paddingHorizontal: Espacamento.padrao,
    boxShadow: escuro ? '0px 8px 24px rgba(0,0,0,0.5)' : '0px 8px 24px rgba(0,0,0,0.12), 0px 1px 3px rgba(0,0,0,0.08)',
  },
  texto: { flex: 1 },
}));
