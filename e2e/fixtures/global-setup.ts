import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/** Reaplica o seed antes da suíte para que os testes partam sempre do mesmo estado (exige `make up`). */
export default function globalSetup() {
  if (process.env.E2E_SKIP_SEED === 'true') return;
  execSync('docker compose exec -T api pnpm --filter @nacif/api exec prisma db seed', {
    cwd: resolve(import.meta.dirname, '../..'),
    stdio: 'inherit',
  });
}
