import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/** Reaplica o seed no D1 local antes da suíte (idempotente), para os testes partirem do mesmo estado. */
export default function globalSetup() {
  if (process.env.E2E_SKIP_SEED === 'true') return;
  execSync('pnpm --filter @nacif/api seed', {
    cwd: resolve(import.meta.dirname, '../..'),
    stdio: 'inherit',
  });
}
