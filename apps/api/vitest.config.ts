import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Testes da API rodam no runtime Workers (workerd) com um D1 local por arquivo de teste.
 * As migrações são lidas aqui (Node) e aplicadas no setup (`src/test/setup.ts`).
 */
export default defineConfig(async () => {
  const migrations = await readD1Migrations(path.join(import.meta.dirname, 'drizzle'));
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            APP_ENV: 'test',
            APP_URL: 'http://localhost:5173',
            COOKIE_SECURE: 'false',
            SESSION_TTL_DAYS: '30',
            LOG_LEVEL: 'silent',
          },
        },
      }),
    ],
    test: {
      include: ['src/**/*.{test,spec}.ts'],
      setupFiles: ['./src/test/setup.ts'],
      testTimeout: 20_000,
      hookTimeout: 60_000,
    },
  };
});
