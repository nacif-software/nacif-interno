/**
 * Imprime um par de chaves VAPID novo para o Web Push. Rode uma vez por ambiente: a privada vai
 * como secret (`wrangler secret put VAPID_PRIVATE_KEY`), a pública e o subject em `vars` no
 * wrangler.jsonc. Nenhuma chave privada entra no repositório, nem a de desenvolvimento.
 *
 *   make vapid-keys                       # subject padrão
 *   pnpm vapid-keys mailto:dev@nacif.xyz  # subject informado
 */
import { generateVapidKeys } from './lib/vapid';

const subject = process.argv[2] ?? 'mailto:wenderson@nacif.xyz';
const { publicKey, privateKey } = generateVapidKeys();

console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log(`VAPID_SUBJECT=${subject}`);
