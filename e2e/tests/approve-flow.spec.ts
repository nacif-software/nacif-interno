import { expect, test } from '@playwright/test';
import { addDays, dayLabel, login, logout, nextMonday, pickDay, users } from '../fixtures/auth';

test('membro cria, aprovador aprova, membro vê aprovada', async ({ page }) => {
  const start = nextMonday(10);
  const end = addDays(start, 2);

  await login(page, users.member);
  await page.goto('/disponibilidade/comunicacoes/nova');
  await expect(
    page.getByRole('heading', { name: 'Nova comunicação de indisponibilidade' }),
  ).toBeVisible();
  await pickDay(page, start);
  await pickDay(page, end);
  await expect(page.getByText('3 dias úteis', { exact: true })).toBeVisible();

  await page
    .getByLabel('Quem cobre suas entregas')
    .selectOption({ label: 'Júlia Reis — projeto Atlas' });
  await expect(page.getByLabel('Aprovador')).toHaveValue(/.+/);
  await page.getByLabel('Aprovador').selectOption({ label: 'Caio Bertelli' });
  await page.getByLabel(/Observações/).fill('Handoff documentado.');
  await page.getByRole('button', { name: 'Enviar comunicação' }).click();

  await expect(page.getByRole('status').filter({ hasText: 'enviada' })).toContainText(
    'Comunicação enviada a Caio Bertelli.',
  );
  await expect(page.getByRole('heading', { name: 'Precisa se ausentar?' })).toBeVisible();
  await logout(page);

  await login(page, users.admin);
  await page.goto('/disponibilidade/aprovacoes');
  const row = page
    .locator('li')
    .filter({ has: page.getByRole('link', { name: /^Pedro Nakano/ }) })
    .filter({ hasText: `${dayLabel(start).slice(0, 2)} – ` })
    .first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Aprovar' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'aprovada' })).toContainText(
    'Comunicação aprovada.',
  );
  await logout(page);

  await login(page, users.member);
  await page.goto('/disponibilidade/comunicacoes?status=APPROVED');
  await expect(page.getByText('Aprovada').first()).toBeVisible();
});
