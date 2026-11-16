import { expect, test } from '@playwright/test';
import { login, users } from '../fixtures/auth';

test('administrador lança crédito e venda, vê o extrato da pessoa e associa dois projetos', async ({
  page,
}) => {
  await login(page, users.admin);
  await page.goto('/disponibilidade/admin');
  await expect(page.getByRole('heading', { name: 'Saldos de dias' })).toBeVisible();

  // Júlia (seed): crédito 10 → saldo inicial lido da tabela
  const row = page.locator('li').filter({ has: page.getByRole('link', { name: 'Júlia Reis' }) });
  const initial = Number((await row.getByTestId('row-balance').textContent())?.trim());

  await row.getByRole('button', { name: 'Lançar crédito' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Júlia Reis');
  await dialog.getByLabel(/^Dias/).fill('5');
  await dialog.getByLabel(/^Nota/).fill('Devolução de dias por troca de feriado');
  await dialog.getByRole('button', { name: 'Lançar crédito' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'lançado' })).toContainText(
    'Crédito de 5 dias lançado para Júlia Reis.',
  );
  await expect(row.getByTestId('row-balance')).toHaveText(String(initial + 5));

  await row.getByRole('button', { name: 'Registrar venda' }).click();
  await dialog.getByLabel(/^Dias/).fill('2');
  await dialog.getByLabel(/^Nota/).fill('Venda acordada no fechamento do mês');
  await dialog.getByRole('button', { name: 'Registrar venda' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'registrada' })).toContainText(
    'Venda de 2 dias registrada para Júlia Reis.',
  );
  await expect(row.getByTestId('row-balance')).toHaveText(String(initial + 3));

  // extrato da pessoa
  await row.getByRole('link', { name: 'Júlia Reis' }).click();
  await expect(page.getByRole('heading', { name: 'Saldo de Júlia Reis' })).toBeVisible();
  await expect(page.getByText('Devolução de dias por troca de feriado')).toBeVisible();
  await expect(page.getByText('Venda acordada no fechamento do mês')).toBeVisible();

  // dois projetos para Júlia
  await page.goto('/disponibilidade/admin');
  const projects = page.getByRole('group', { name: 'Projetos de Júlia Reis' });
  await projects.getByRole('button', { name: 'Atlas' }).click();
  await expect(projects.getByRole('checkbox', { name: 'Atlas' })).toBeChecked();
  await projects.getByRole('checkbox', { name: 'Vega' }).check();
  await expect(projects.getByRole('button', { name: '2 projetos' })).toBeVisible();
  // desfaz para não afetar os outros testes
  await projects.getByRole('checkbox', { name: 'Vega' }).uncheck();
  await expect(projects.getByRole('button', { name: 'Atlas' })).toBeVisible();
});
