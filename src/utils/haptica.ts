// Haptics (expo-haptics, aprovado em docs/DESIGN.md). Nunca bloqueia nem quebra a UI: no web
// depende da Vibration API e em aparelhos sem motor de vibração simplesmente não faz nada.
import * as Haptics from 'expo-haptics';

export function hapticaImpacto(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

export function hapticaSucesso(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticaSelecao(): void {
  Haptics.selectionAsync().catch(() => {});
}
