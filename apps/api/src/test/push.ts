import { pushRepository } from '../modules/core/push/push.repository';
import { setPushTransport } from '../modules/core/push/push.service';

const b64u = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** Chaves de cliente válidas (P-256 + auth de 16 bytes), como o navegador geraria. */
export async function fakeClientKeys(): Promise<{ p256dh: string; auth: string }> {
  const pair = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ])) as CryptoKeyPair;
  const raw = (await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer;
  return { p256dh: b64u(raw), auth: b64u(crypto.getRandomValues(new Uint8Array(16))) };
}

export const PUSH_ORIGIN = 'https://push.example';

export interface SentPush {
  endpoint: string;
  headers: Record<string, string>;
}

/**
 * Substitui o envio HTTP por um registrador: devolve os envios e permite escolher o status por
 * endpoint (padrão 201). Chame `restore()` no fim do teste.
 */
export function recordPushes(statusFor: (endpoint: string) => number = () => 201) {
  const sent: SentPush[] = [];
  setPushTransport((endpoint, init) => {
    const headers = Object.fromEntries(
      Object.entries((init.headers ?? {}) as Record<string, string>).map(([k, v]) => [
        k.toLowerCase(),
        String(v),
      ]),
    );
    sent.push({ endpoint, headers });
    return Promise.resolve(new Response(null, { status: statusFor(endpoint) }));
  });
  return {
    sent,
    to: (path: string) => sent.filter((s) => s.endpoint === `${PUSH_ORIGIN}/${path}`),
    restore: () => setPushTransport(null),
  };
}

/** Grava uma assinatura de push para a pessoa, com endpoint `https://push.example/<path>`. */
export async function subscribeFake(userId: string, path: string): Promise<string> {
  const keys = await fakeClientKeys();
  const endpoint = `${PUSH_ORIGIN}/${path}`;
  await pushRepository.upsert({ userId, endpoint, ...keys, userAgent: 'test' });
  return endpoint;
}
