import { expect, test } from '@playwright/test';
import { PASSWORD, users } from '../fixtures/auth';

// O Chromium headless responde `Notification.permission === 'denied'` mesmo com a permissão concedida
// pelo Playwright. O spec testa a UI (modal e tela), não a entrega: forçamos o estado "pendente".
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Notification, 'permission', { get: () => 'default', configurable: true });
  });
});

test('modal de avisos aparece uma vez por navegador e a tela Notificações mostra o estado', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(users.approver);
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: /Entrar/ }).click();

  const dialog = page.getByRole('dialog', { name: 'Avisos no navegador' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Com o papel Aprovador, você recebe:');
  await expect(dialog).toContainText('Nova comunicação endereçada a você para avaliar');
  await dialog.getByRole('button', { name: 'Agora não' }).click();
  await expect(dialog).toHaveCount(0);

  await page.reload();
  await expect(
    page
      .getByRole('heading', { name: 'Precisa se ausentar?' })
      .or(page.getByRole('heading', { name: 'Serviços' })),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', { name: /Menu de/ }).click();
  await page.getByRole('menuitem', { name: 'Notificações' }).click();
  await expect(page).toHaveURL(/\/notificacoes$/);
  await expect(page.getByRole('heading', { name: 'Notificações' })).toBeVisible();
  await expect(page.getByTestId('push-status')).toContainText('Desligado');
  await expect(page.getByRole('switch', { name: 'Avisos neste dispositivo' })).not.toBeChecked();
  await expect(page.getByText('Onde funciona')).toBeVisible();
});

test('service worker e manifest da PWA são servidos pelo Worker', async ({ request }) => {
  const sw = await request.get('/sw.js');
  expect(sw.status()).toBe(200);
  expect(sw.headers()['content-type']).toContain('javascript');
  expect(await sw.text()).toContain("addEventListener('push'");

  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  expect(manifest.headers()['content-type']).toContain('manifest');
  expect((await manifest.json()).display).toBe('standalone');
});
