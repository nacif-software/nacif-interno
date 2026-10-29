import { defineConfig, devices } from '@playwright/test';

/**
 * Um único modo, igual ao CI: o build de produção do web servido pelo Worker local
 * (`wrangler dev`, com D1 local) em http://localhost:8787. O servidor sobe sozinho;
 * localmente, um `make dev-api` já de pé é reaproveitado.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:8787';

export default defineConfig({
  testDir: './tests',
  globalSetup: './fixtures/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  webServer: {
    command:
      'pnpm --filter @nacif/web build && pnpm --filter @nacif/api migrate && pnpm --filter @nacif/api exec wrangler dev --port 8787',
    cwd: '..',
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['iPhone 13'] }, testMatch: /.*mobile\.spec\.ts/ },
  ],
});
