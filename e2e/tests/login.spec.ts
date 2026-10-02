import { expect, test } from '@playwright/test';
import { login, users } from '../fixtures/auth';

test('bloqueia domínio fora de nacif.xyz com a copy do design', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('rafael@gmail.com');
  await page.getByLabel('Senha').fill('qualquer-coisa');
  await page.getByRole('button', { name: 'Entrar com e-mail Nacif' }).click();
  await expect(page.getByText('Domínio não autorizado')).toBeVisible();
  await expect(
    page.getByText(
      'A conta rafael@gmail.com não pertence ao domínio nacif.xyz. Entre com seu e-mail Nacif.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar com outra conta' })).toBeVisible();
});

test('login de membro leva ao portal e ao módulo', async ({ page }) => {
  await login(page, users.member);
  await expect(page.getByRole('heading', { name: 'Serviços' })).toBeVisible();
  await page.getByRole('link', { name: /Nacif Disponibilidade/ }).click();
  await expect(page.getByRole('heading', { name: 'Precisa se ausentar?' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Principal' }).first()).toContainText(
    'Minhas comunicações',
  );
});
