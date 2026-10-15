// Foco visível para controles tocáveis (WCAG 2.4.7). No web, só acende quando o foco veio do
// teclado (:focus-visible) — clique de mouse não deixa anel. Em nativo, onFocus só dispara com
// teclado físico/TV, então qualquer foco conta.
import { useCallback, useState } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import { Cores } from '../theme';

type EventoFoco = { nativeEvent?: { target?: unknown }; target?: unknown };

function veioDoTeclado(evento: EventoFoco): boolean {
  if (Platform.OS !== 'web') return true;
  const alvo = (evento?.nativeEvent?.target ?? evento?.target) as { matches?: (seletor: string) => boolean } | undefined;
  try {
    return alvo?.matches?.(':focus-visible') ?? true;
  } catch {
    return true;
  }
}

export function useFocoVisivel() {
  const [focado, setFocado] = useState(false);
  const onFocus = useCallback((evento: EventoFoco) => setFocado(veioDoTeclado(evento)), []);
  const onBlur = useCallback(() => setFocado(false), []);
  return { focado, propsFoco: { onFocus, onBlur } };
}

// Anel de foco: 2px em `foco` (= acento), afastado 2px do controle. O outline nativo do navegador
// fica sempre desligado — este anel é o substituto, não uma remoção.
export const estiloSemOutline: ViewStyle = { outlineWidth: 0 } as ViewStyle;
export const estiloAnelFoco: ViewStyle = {
  outlineStyle: 'solid',
  outlineWidth: 2,
  outlineColor: Cores.foco,
  outlineOffset: 2,
} as ViewStyle;
