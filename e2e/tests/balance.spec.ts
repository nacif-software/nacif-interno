import { expect, test, type Page } from '@playwright/test';
import { addDays, dayLabel, login, logout, nextMonday, pickDay, users } from '../fixtures/auth';

/** Lê o número do card "Saldo de dias" do painel. */
async function readBalance(page: Page): Promise<number> {
  const value = page.getByTestId('balance-value');
  await expect(value).toBeVisible();
  return Number((await value.textContent())?.trim());
}

test('membro vê o saldo no painel e no extrato; aprovador ajusta os dias descontados', async ({
  page,
}) => {
  await login(page, users.member);
  await page.goto('/disponibilidade');
  const initial = await readBalance(page);
  await page.getByRole('link', { name: /Saldo de dias/ }).click();
  await expect(page).toHaveURL(/\/disponibilidade\/saldo$/);
  await expect(page.getByRole('heading', { name: 'Meu saldo' })).toBeVisible();
  await expect(page.getByText('Venda de dias')).toBeVisible();
  await expect(page.getByText('Venda acordada em outubro')).toBeVisible();

  // Nova comunicação de 2 dias úteis: o formulário mostra o saldo após
  const start = nextMonday(10);
  const end = addDays(start, 1);
  const after = initial - 2;
  await page.goto('/disponibilidade/comunicacoes/nova');
  await expect(
    page.getByRole('heading', { name: 'Nova comunicação de indisponibilidade' }),
  ).toBeVisible();
  await pickDay(page, start);
  await pickDay(page, end);
  await expect(page.getByTestId('balance-after')).toContainText(
    `Saldo após esta comunicação: ${after} dia${Math.abs(after) === 1 ? '' : 's'}.`,
  );
  await page
    .getByLabel('Quem cobre suas entregas')
    .selectOption({ label: 'Júlia Reis — projeto Atlas' });
  await page.getByLabel('Aprovador').selectOption({ label: 'Marina Duarte' });
  await page.getByRole('button', { name: 'Enviar comunicação' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'enviada' })).toBeVisible();
  await logout(page);

  // Marina aprova ajustando para 0 dias (troca de feriado)
  await login(page, users.approver);
  await page.goto('/disponibilidade/aprovacoes');
  const row = page
    .locator('li')
    .filter({ has: page.getByRole('link', { name: /^Pedro Nakano/ }) })
    .filter({ hasText: `${dayLabel(start).slice(0, 2)} – ` })
    .first();
  await expect(row).toContainText(`${initial} → ${after}`);
  await row.getByRole('link', { name: /^Pedro Nakano/ }).click();
  await expect(page.getByTestId('author-balance')).toContainText(
    `Saldo de Pedro Nakano: ${initial} → ${after}`,
  );
  await page.getByRole('button', { name: 'Ajustar dias descontados' }).click();
  await page.getByRole('spinbutton', { name: /Dias descontados/ }).fill('0');
  await page.getByLabel('Motivo do ajuste').fill('Troca do feriado da cidade pelos dias 23 e 24');
  await page.getByRole('button', { name: 'Aprovar com 0 dias' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'aprovada' })).toBeVisible();
  await expect(page.getByText('Aprovada por Marina Duarte (0 dias descontados)')).toBeVisible();
  await logout(page);

  // Saldo de Pedro não mudou: a comunicação foi aprovada com 0 dias descontados
  await login(page, users.member);
  await page.goto('/disponibilidade');
  expect(await readBalance(page)).toBe(initial);
});
