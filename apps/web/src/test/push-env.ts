import { vi } from 'vitest';

/** Simula um navegador com Web Push (jsdom não tem service worker nem Notification). */
export function stubPushBrowser(
  options: { permission?: NotificationPermission; subscribed?: boolean } = {},
) {
  const subscription = options.subscribed
    ? {
        endpoint: 'https://push.example/sub',
        unsubscribe: vi.fn().mockResolvedValue(true),
        toJSON: () => ({}),
      }
    : null;
  const registration = {
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(subscription),
      subscribe: vi.fn().mockResolvedValue(subscription),
    },
  };
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      getRegistration: vi.fn().mockResolvedValue(registration),
      register: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
    },
  });
  vi.stubGlobal('PushManager', class PushManager {});
  vi.stubGlobal('Notification', {
    permission: options.permission ?? 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  return { registration };
}

export function unstubPushBrowser() {
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
}
