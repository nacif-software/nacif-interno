import { expect, test } from '@playwright/test';
import { login, users } from '../fixtures/auth';

test('aprovador recusa com justificativa obrigatória', async ({ page }) => {
  await login(page, users.admin);
  await page.goto('/disponibilidade/aprovacoes?period=all');
  const row = page
    .locator('li')
    .filter({ has: page.getByRole('link', { name: /^Bruna Alencar/ }) })
    .first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Recusar' }).click();

  const dialog = page.getByRole('dialog', { name: 'Recusar comunicação' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/Justificativa/).fill('curta');
  await dialog.getByRole('button', { name: 'Confirmar recusa' }).click();
  await expect(
    dialog.getByText('Informe uma justificativa com ao menos 20 caracteres.'),
  ).toBeVisible();

  await dialog
    .getByLabel(/Justificativa/)
    .fill('Coincide com a virada de release do Vega. Sugiro outra semana.');
  await dialog.getByRole('button', { name: 'Confirmar recusa' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'recusada' })).toContainText(
    'Comunicação recusada. O autor foi notificado.',
  );
  await expect(row).toBeHidden();
});
