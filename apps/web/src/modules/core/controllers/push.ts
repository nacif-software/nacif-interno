/** Utilitários do Web Push no navegador (sem React). */

export type PromptState = 'dismissed' | 'enabled';

const promptKey = (userId: string) => `nacif.push.prompt:${userId}`;

export function readPromptState(userId: string): PromptState | null {
  try {
    const v = localStorage.getItem(promptKey(userId));
    return v === 'dismissed' || v === 'enabled' ? v : null;
  } catch {
    return null;
  }
}

export function writePromptState(userId: string, state: PromptState): void {
  try {
    localStorage.setItem(promptKey(userId), state);
  } catch {
    // armazenamento bloqueado (modo privado): o modal volta na próxima visita, sem erro
  }
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isIos(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches) ||
    nav.standalone === true
  );
}

/** iPhone/iPad fora da Tela de Início: o push não existe até instalar. */
export function needsHomeScreen(): boolean {
  return isIos() && !isStandalone();
}

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration('/');
  return reg ? reg.pushManager.getSubscription() : null;
}

export function subscriptionBody(sub: PushSubscription, replaces?: string) {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint ?? sub.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
    userAgent: navigator.userAgent.slice(0, 300),
    ...(replaces ? { replaces } : {}),
  };
}
