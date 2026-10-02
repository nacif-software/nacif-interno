import { expect, test } from '@playwright/test';
import { login, users } from '../fixtures/auth';

test('aprova em lote e desfaz pelo toast', async ({ page }) => {
  await login(page, users.admin);
  await page.goto('/disponibilidade/aprovacoes');
  const rows = page.locator('li').filter({ has: page.getByRole('button', { name: 'Aprovar' }) });
  await expect(rows.first()).toBeVisible();
  const before = await rows.count();
  expect(before).toBeGreaterThanOrEqual(2);

  await rows.nth(0).getByRole('checkbox').check();
  await rows.nth(1).getByRole('checkbox').check();
  await expect(page.getByText('2 selecionadas')).toBeVisible();
  await page.getByRole('button', { name: 'Aprovar em lote' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'em lote' })).toContainText(
    '2 comunicações aprovadas em lote.',
  );
  await expect(rows).toHaveCount(before - 2);

  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'desfeitas' })).toContainText(
    '2 aprovações desfeitas.',
  );
  await expect(rows).toHaveCount(before);
});
