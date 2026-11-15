/* Service worker do Nacif Interno: só Web Push (ADR 0013). Sem cache de assets. */
/* global self, URL, fetch */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  // Sempre mostra algo: o Safari revoga a assinatura depois de 3 pushes sem notificação visível.
  event.waitUntil(
    self.registration.showNotification(data.title || 'Nacif Interno', {
      body: data.body || '',
      icon: '/icons/192.png',
      badge: '/icons/badge-72.png',
      tag: data.tag || undefined,
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(
    (event.notification.data && event.notification.data.url) || '/',
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((c) => c.url.startsWith(self.location.origin));
      if (open) {
        return open.focus().then((c) => (c && 'navigate' in c ? c.navigate(url) : undefined));
      }
      return self.clients.openWindow(url);
    }),
  );
});

// O navegador trocou a assinatura por conta própria: reassina e avisa a API (não roda no iOS).
self.addEventListener('pushsubscriptionchange', (event) => {
  const old = event.oldSubscription;
  const options = old && old.options ? old.options : { userVisibleOnly: true };
  event.waitUntil(
    self.registration.pushManager.subscribe(options).then((sub) =>
      fetch('/api/push/subscriptions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...sub.toJSON(), replaces: old ? old.endpoint : undefined }),
      }),
    ),
  );
});
