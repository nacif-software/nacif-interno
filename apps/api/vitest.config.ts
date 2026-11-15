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
            // Chaves de desenvolvimento (iguais ao .dev.vars.example); o envio real é interceptado nos testes.
            VAPID_PUBLIC_KEY:
              'BId_1KBQAzTJ4qDEFOJiF0lVDdNDmDlUaa-t3-vKc9s3ZTmTE_TE2TbBiWbEIX5I4hTh0nDkgI3gu2YJpRNlFN0',
            VAPID_PRIVATE_KEY: 'rJjwZi9FnFQMjRrK0DwJl6zJvfMJbQuVFgmIZErE87A',
            VAPID_SUBJECT: 'mailto:dev@nacif.xyz',
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
