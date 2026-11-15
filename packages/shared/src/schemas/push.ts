import { z } from 'zod';

/** Assinatura de Web Push como o navegador devolve em `PushSubscription.toJSON()`. */
export const pushSubscriptionBodySchema = z.object({
  endpoint: z.string().url().max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
  userAgent: z.string().max(300).optional(),
  /** Endpoint antigo, quando o navegador trocou a assinatura (`pushsubscriptionchange`). */
  replaces: z.string().url().max(2048).optional(),
});
export type PushSubscriptionBody = z.infer<typeof pushSubscriptionBodySchema>;

export const pushUnsubscribeBodySchema = z.object({ endpoint: z.string().url().max(2048) });
export type PushUnsubscribeBody = z.infer<typeof pushUnsubscribeBodySchema>;

export const pushConfigSchema = z.object({
  enabled: z.boolean(),
  /** Chave pública VAPID (base64url) para `pushManager.subscribe`; null quando desligado. */
  publicKey: z.string().nullable(),
});
export type PushConfig = z.infer<typeof pushConfigSchema>;

/** Conteúdo de um aviso, como chega no service worker. */
export const pushNotificationSchema = z.object({
  title: z.string(),
  body: z.string(),
  /** Caminho no app aberto ao clicar. */
  url: z.string(),
  /** Agrupa avisos da mesma comunicação (o mais novo substitui o anterior). */
  tag: z.string(),
});
export type PushNotification = z.infer<typeof pushNotificationSchema>;
