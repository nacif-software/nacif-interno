import { expect, test } from '@playwright/test';
import { login, users } from '../fixtures/auth';

test('rotas antigas em português redirecionam para as novas, com parâmetros e query string', async ({
  page,
}) => {
  await login(page, users.admin);

  await page.goto('/disponibilidade/aprovacoes?period=all');
  await expect(page).toHaveURL(/\/disponibilidade\/approvals\?period=all$/);
  await expect(page.getByRole('heading', { name: 'Fila de aprovação' })).toBeVisible();

  await page.goto('/disponibilidade/administracao');
  await expect(page).toHaveURL(/\/disponibilidade\/admin$/);

  await page.goto('/disponibilidade/saldo/u-inexistente');
  await expect(page).toHaveURL(/\/disponibilidade\/balance\/u-inexistente$/);

  await page.goto('/notificacoes');
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(page.getByRole('heading', { name: 'Notificações' })).toBeVisible();
});

test('link de senha antigo continua abrindo a tela de definição de senha', async ({ page }) => {
  await page.goto('/definir-senha/token-antigo');
  await expect(page).toHaveURL(/\/set-password\/token-antigo$/);
  await expect(page.getByRole('alert')).toContainText('Link inválido ou expirado');
});
