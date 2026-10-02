import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import '../config/load-dotenv';

/** Aplica as migrações no banco de teste antes de qualquer arquivo de teste rodar. */
export default function globalSetup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL não definida (veja .env.example).');
  const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  execSync('pnpm exec prisma migrate deploy', {
    cwd: apiDir,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
