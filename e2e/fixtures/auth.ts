import { expect, type Page } from '@playwright/test';

export const PASSWORD = process.env.SEED_PASSWORD ?? 'nacif1234';

export const users = {
  admin: 'caio@nacif.xyz',
  approver: 'marina@nacif.xyz',
  member: 'pedro@nacif.xyz',
  memberAtlas: 'julia@nacif.xyz',
};

export async function login(page: Page, email: string, password: string = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: /Entrar/ }).click();
  await expect(page).toHaveURL(/\/(disponibilidade)?$/);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /Menu de/ }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login/);
}

/** Próxima segunda-feira com ao menos `minDays` de antecedência, como YYYY-MM-DD. */
export function nextMonday(minDays = 8): Date {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + minDays);
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTHS_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/** Rótulo acessível de um dia no seletor: '05 out 2026'. */
export function dayLabel(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function monthTitle(d: Date): string {
  return `${MONTHS_FULL[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** Navega o seletor de período até o mês de `target` e clica no dia (só elementos visíveis). */
export async function pickDay(page: Page, target: Date) {
  const title = page.getByText(monthTitle(target), { exact: true }).filter({ visible: true });
  const next = page.getByRole('button', { name: 'Próximo mês' }).filter({ visible: true });
  for (let i = 0; i < 12 && (await title.count()) === 0; i++) {
    await next.first().click();
  }
  await page
    .getByRole('gridcell', { name: dayLabel(target) })
    .filter({ visible: true })
    .first()
    .click();
}
