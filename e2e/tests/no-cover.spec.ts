import { expect, test } from '@playwright/test';
import { addDays, login, logout, nextMonday, pickDay, rangeLabel, users } from '../fixtures/auth';

test('membro envia sem cobertura e o aprovador vê "Não informada" no detalhe', async ({ page }) => {
  const start = nextMonday(24);
  const end = addDays(start, 1);

  await login(page, users.member);
  await page.goto('/disponibilidade/communications/new');
  await pickDay(page, start);
  await pickDay(page, end);
  await expect(page.getByLabel(/Quem cobre suas entregas/)).toHaveValue('');
  await page.getByLabel('Aprovador').selectOption({ label: 'Caio Bertelli' });
  await page.getByRole('button', { name: 'Enviar comunicação' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'enviada' })).toBeVisible();
  await logout(page);

  await login(page, users.admin);
  await page.goto('/disponibilidade/approvals?period=all');
  const row = page
    .locator('li')
    .filter({ has: page.getByRole('link', { name: /^Pedro Nakano/ }) })
    .filter({ hasText: rangeLabel(start, end) })
    .first();
  await expect(row).toBeVisible();
  await row.getByRole('link', { name: /^Pedro Nakano/ }).click();
  await expect(page.getByText('Cobertura', { exact: true })).toBeVisible();
  await expect(page.getByText('Não informada', { exact: true })).toBeVisible();
});
