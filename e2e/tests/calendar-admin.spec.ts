import { expect, test } from '@playwright/test';
import { login, users } from '../fixtures/auth';

test('calendário do time mostra outubro de 2026 com barras e filtro por projeto', async ({
  page,
}) => {
  await login(page, users.approver);
  await page.goto('/disponibilidade/calendario?month=2026-10');
  await expect(page.getByRole('heading', { name: 'Outubro 2026' })).toBeVisible();
  await expect(page.getByText('Pedro Nakano')).toBeVisible();
  await expect(page.getByRole('link', { name: /Em análise/ }).first()).toBeVisible();
  await page.getByLabel('Filtrar por projeto').selectOption({ label: 'Projeto: Órion' });
  await expect(page.getByText('Bruna Alencar')).toBeHidden();
});

test('administrador vê pessoas, projetos e configurações', async ({ page }) => {
  await login(page, users.admin);
  await page.goto('/disponibilidade/administracao');
  await expect(page.getByRole('heading', { name: 'Pessoas' })).toBeVisible();
  await expect(page.getByText('thiago@nacif.xyz')).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Ativar Thiago Lemos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible();
  await expect(page.getByLabel('Antecedência mínima')).toHaveValue('7');
  await expect(
    page.getByText('Usados quando o membro do time não escolhe um aprovador.'),
  ).toBeVisible();
});

test('membro não acessa a fila de aprovação', async ({ page }) => {
  await login(page, users.member);
  await page.goto('/disponibilidade/aprovacoes');
  await expect(page).toHaveURL(/\/$/);
});
