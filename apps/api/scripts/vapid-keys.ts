/**
 * Gera um par de chaves VAPID (P-256) para o Web Push, no formato que `@block65/webcrypto-web-push`
 * e o navegador esperam: pública = ponto não comprimido de 65 bytes, privada = escalar `d`, ambos
 * base64url sem padding. Rode uma vez por ambiente e guarde a privada como secret
 * (`wrangler secret put VAPID_PRIVATE_KEY`); a pública vai em `vars` no wrangler.jsonc.
 *
 *   make vapid-keys
 */
import { Buffer } from 'node:buffer';
import { generateKeyPairSync } from 'node:crypto';

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pub = publicKey.export({ format: 'jwk' }) as { x: string; y: string };
const priv = privateKey.export({ format: 'jwk' }) as { d: string };
const raw = Buffer.concat([
  Buffer.from([0x04]),
  Buffer.from(pub.x, 'base64url'),
  Buffer.from(pub.y, 'base64url'),
]);

console.log(`VAPID_PUBLIC_KEY=${raw.toString('base64url')}`);
console.log(`VAPID_PRIVATE_KEY=${priv.d}`);
console.log('VAPID_SUBJECT=mailto:wenderson@nacif.xyz');
