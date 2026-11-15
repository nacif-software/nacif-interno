import { buildPushPayload } from '@block65/webcrypto-web-push';
import type { PushConfig, PushNotification, PushSubscriptionBody } from '@nacif/shared';
import { vapidKeys } from '../../../config/env';
import type { AuthenticatedUser } from '../../../infra/http/context';
import { NotFoundError } from '../../../infra/http/errors';
import { logger } from '../../../infra/logger';
import { pushRepository } from './push.repository';

/** Envio HTTP ao serviço de push; os testes trocam por um registrador (`setPushTransport`). */
type PushTransport = (endpoint: string, init: RequestInit) => Promise<Response>;
let transport: PushTransport = (endpoint, init) => fetch(endpoint, init);

export function setPushTransport(fn: PushTransport | null): void {
  transport = fn ?? ((endpoint, init) => fetch(endpoint, init));
}

/** Validade do aviso no serviço de push, se o dispositivo estiver offline. */
const TTL_SECONDS = 24 * 60 * 60;
/** O `topic` do Web Push aceita até 32 caracteres base64url; a `tag` é `comm-<uuid>`. */
const TOPIC_MAX = 32;

/**
 * Web Push (ADR 0013): assinaturas por pessoa e dispositivo, envio direto do Worker para o serviço
 * de push do navegador com VAPID e aes128gcm. `notify` nunca lança: falha vira log e assinatura
 * expirada (404/410) é apagada.
 */
export const pushService = {
  config(): PushConfig {
    const keys = vapidKeys();
    return { enabled: keys !== null, publicKey: keys?.publicKey ?? null };
  },

  async subscribe(actor: AuthenticatedUser, body: PushSubscriptionBody): Promise<void> {
    if (body.replaces && body.replaces !== body.endpoint) {
      await pushRepository.deleteByEndpoint(body.replaces, actor.id);
    }
    await pushRepository.upsert({
      userId: actor.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: body.userAgent ?? null,
    });
  },

  async unsubscribe(actor: AuthenticatedUser, endpoint: string): Promise<void> {
    const removed = await pushRepository.deleteByEndpoint(endpoint, actor.id);
    if (removed === 0) throw new NotFoundError('Assinatura não encontrada.');
  },

  /** Envia o aviso a todos os dispositivos das pessoas. Chame via `background()`. */
  async notify(userIds: string[], notification: PushNotification): Promise<void> {
    const vapid = vapidKeys();
    const targets = [...new Set(userIds)];
    if (!vapid || targets.length === 0) return;
    const subscriptions = await pushRepository.listByUsers(targets);
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const payload = await buildPushPayload(
            {
              data: notification,
              options: {
                ttl: TTL_SECONDS,
                urgency: 'normal',
                topic: notification.tag.replace(/[^A-Za-z0-9_-]/g, '').slice(0, TOPIC_MAX),
              },
            },
            {
              endpoint: sub.endpoint,
              expirationTime: null,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            vapid,
          );
          const res = await transport(sub.endpoint, payload);
          if (res.status === 404 || res.status === 410) {
            await pushRepository.deleteByEndpoint(sub.endpoint);
            logger.info({ userId: sub.userId }, 'Assinatura de push expirada removida');
          } else if (!res.ok) {
            logger.warn(
              { userId: sub.userId, status: res.status },
              'Serviço de push recusou o aviso',
            );
          } else {
            await pushRepository.touch(sub.id, new Date());
          }
        } catch (err) {
          logger.warn({ err, userId: sub.userId }, 'Falha ao enviar push');
        }
      }),
    );
  },
};
