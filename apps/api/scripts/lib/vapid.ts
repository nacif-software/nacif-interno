import { Buffer } from 'node:buffer';
import { generateKeyPairSync } from 'node:crypto';

/**
 * Gera um par de chaves VAPID (P-256) para o Web Push, no formato que `@block65/webcrypto-web-push`
 * e o navegador esperam: pública = ponto não comprimido de 65 bytes, privada = escalar `d`, ambos
 * base64url sem padding. Usado pelo `make vapid-keys`, pelo `make install` (par local) e pelos testes.
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pub = publicKey.export({ format: 'jwk' }) as { x: string; y: string };
  const priv = privateKey.export({ format: 'jwk' }) as { d: string };
  const raw = Buffer.concat([
    Buffer.from([0x04]),
    Buffer.from(pub.x, 'base64url'),
    Buffer.from(pub.y, 'base64url'),
  ]);
  return { publicKey: raw.toString('base64url'), privateKey: priv.d };
}
