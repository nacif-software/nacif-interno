import { defineConfig, devices } from '@playwright/test';

/**
 * Dois modos:
 * - padrão (local): testa o dev server do `make up` em http://localhost:5173.
 * - E2E_PREVIEW=true (CI): faz o build do web e serve com `vite preview` em :4173,
 *   com proxy de /api para VITE_API_PROXY_TARGET. Determinístico em ambiente frio.
 */
const preview = process.env.E2E_PREVIEW === 'true';
const baseURL =
  process.env.E2E_BASE_URL ?? (preview ? 'http://localhost:4173' : 'http://localhost:5173');

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
  webServer: preview
    ? {
        command: 'pnpm --filter @nacif/web build && pnpm --filter @nacif/web preview',
        cwd: '..',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: 'pipe',
      }
    : undefined,
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['iPhone 13'] }, testMatch: /.*mobile\.spec\.ts/ },
  ],
});
