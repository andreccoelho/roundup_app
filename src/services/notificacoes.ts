// RF31: registro do aparelho para notificações push (expo-notifications, SDK 58). O token Expo
// fica em usuarios/{uid}/privado/notificacoes — documento fechado a outros usuários (mesmo motivo
// de privado/vinculos: `usuarios/{uid}` raiz é legível por qualquer autenticado). O envio é das
// Cloud Functions em functions/src/notificacoes.ts, que respeitam usuarios.preferenciasNotificacao.
//
// Limites (docs.expo.dev, SDK 58): push remoto não funciona no Expo Go no Android nem na web —
// precisa de development build (perfil `development` do eas.json, com expo-dev-client). Sem
// `extra.eas.projectId` no app.json (`eas init`), getExpoPushTokenAsync rejeita — ele lê o projectId
// sozinho de Constants.easConfig / expoConfig.extra.eas. Nos dois casos o registro falha em silêncio
// (só console): o app funciona igual, só não recebe push. Passo a passo para validar no aparelho:
// docs/ROTEIRO_TESTE_NOTIFICACOES.md.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { arrayRemove, arrayUnion, doc, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import type { PreferenciasNotificacao } from '../types';

const CANAL_ANDROID = 'padrao';

// Sem handler, notificação que chega com o app aberto não aparece (docs do SDK 58). Na web não há
// push (a doc do SDK 58 só lista Android e iOS), então nem registra.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

let tokenRegistrado: { usuarioId: string; token: string } | null = null;

function refPrivado(usuarioId: string) {
  return doc(db, 'usuarios', usuarioId, 'privado', 'notificacoes');
}

// Pede permissão (uma vez; depois o sistema lembra a resposta), obtém o token Expo e grava.
// Devolve o token, ou null quando não há como receber push neste aparelho.
export async function registrarDispositivo(usuarioId: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  // Android 13+: o pedido de permissão só aparece depois que existe um canal
  await Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
    name: 'Avisos do RoundUp',
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  const atual = await Notifications.getPermissionsAsync();
  const permissao = atual.granted ? atual : await Notifications.requestPermissionsAsync();
  if (!permissao.granted) return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await setDoc(refPrivado(usuarioId), { tokens: arrayUnion(token) }, { merge: true });
    tokenRegistrado = { usuarioId, token };
    return token;
  } catch (e) {
    console.warn('Não foi possível registrar o aparelho para notificações:', e);
    return null;
  }
}

// Ao sair, o aparelho deixa de receber push desta conta
export async function desregistrarDispositivo(): Promise<void> {
  if (!tokenRegistrado) return;
  const { usuarioId, token } = tokenRegistrado;
  tokenRegistrado = null;
  try {
    await updateDoc(refPrivado(usuarioId), { tokens: arrayRemove(token) });
  } catch (e) {
    console.warn('Não foi possível remover o token de notificações:', e);
  }
}

export type StatusTeste = 'enviado' | 'erro' | 'semDispositivo' | 'simulado' | 'desligado';

// RF31: pede ao servidor uma notificação de exemplo deste tipo, só para o próprio usuário, pelo
// caminho real (Cloud Function enviarNotificacaoDeTeste → Expo → FCM/APNs). Antes, tenta registrar
// o aparelho de novo (se a permissão foi dada depois do login, o token entra agora).
export async function enviarNotificacaoDeTeste(usuarioId: string, tipo: keyof PreferenciasNotificacao): Promise<StatusTeste> {
  await registrarDispositivo(usuarioId);
  const resposta = await httpsCallable<{ tipo: string }, { status: StatusTeste }>(functions, 'enviarNotificacaoDeTeste')({ tipo });
  return resposta.data.status;
}
