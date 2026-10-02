import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Carrega .env do pacote e da raiz do monorepo (sem sobrescrever variáveis já definidas).
 * No Docker as variáveis vêm do compose; no host, do .env da raiz.
 */
const here = dirname(fileURLToPath(import.meta.url));
for (const candidate of [resolve(here, '../../.env'), resolve(here, '../../../../.env')]) {
  if (existsSync(candidate)) config({ path: candidate, quiet: true });
}
