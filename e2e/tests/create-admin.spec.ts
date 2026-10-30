import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { logout } from '../fixtures/auth';

const EMAIL = 'admin.e2e@nacif.xyz';

/** Roda o script do primeiro administrador no D1 local e devolve o token do link impresso. */
function createAdminToken(): string {
  const output = execFileSync(
    'pnpm',
    ['--filter', '@nacif/api', 'create-admin', EMAIL, '--local'],
    {
      cwd: resolve(import.meta.dirname, '../..'),
      encoding: 'utf8',
    },
  );
  const token = /\/definir-senha\/([0-9a-f]+)/.exec(output)?.[1];
  if (!token) throw new Error(`Link não encontrado na saída do create-admin:\n${output}`);
  return token;
}

test('create-admin: o link define a senha e dá acesso à Administração', async ({ page }) => {
  const token = createAdminToken();

  await page.goto(`/definir-senha/${token}`);
  await expect(
    page.getByRole('heading', { name: /Defina sua senha|Redefina sua senha/ }),
  ).toBeVisible();
  // Primeira execução pede nome; nas seguintes (pessoa já com senha) só a senha.
  const name = page.getByLabel('Nome');
  if (await name.isVisible()) await name.fill('Admin E2E');
  await page.getByLabel('Senha', { exact: true }).fill('senha-e2e-123');
  await page.getByRole('button', { name: 'Salvar e entrar' }).click();

  await expect(page).toHaveURL(/\/$/);
  await page.goto('/disponibilidade/administracao');
  await expect(page.getByRole('link', { name: 'Administração' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pessoas' })).toBeVisible();

  // O mesmo link não vale duas vezes.
  await logout(page);
  await page.goto(`/definir-senha/${token}`);
  await expect(page.getByRole('alert')).toContainText('Link inválido ou expirado');
});
