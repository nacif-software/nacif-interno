import type { DashboardDto, SessionUser } from '@nacif/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { renderWithProviders } from '@/test/render';
import { DashboardPage } from '../pages/dashboard-page';

const pedro: SessionUser = {
  id: 'u-pedro',
  name: 'Pedro Nakano',
  initials: 'PN',
  email: 'pedro@nacif.xyz',
  role: 'MEMBER',
  active: true,
  projects: [],
};

function dashboard(balance: number): DashboardDto {
  return {
    year: 2026,
    balance,
    daysCommunicatedInYear: 8,
    inReviewCount: 0,
    inReviewApproverName: null,
    nextUnavailability: null,
    recent: [],
  };
}

function mock(balance: number) {
  mockApi((url) => {
    if (url.pathname === '/api/disponibilidade/dashboard') return { body: dashboard(balance) };
    if (url.pathname === '/api/disponibilidade/settings')
      return {
        body: {
          minNoticeDays: 7,
          maxSimultaneousPerProject: 2,
          daysPerYear: 10,
          defaultApprovers: [],
        },
      };
    return undefined;
  });
}

describe('card Saldo de dias no painel', () => {
  it('mostra o saldo, os dias comunicados e leva ao extrato', async () => {
    mock(5);
    renderWithProviders(<DashboardPage />, { sessionUser: pedro, route: '/disponibilidade' });
    const card = await screen.findByRole('link', { name: /Saldo de dias/ });
    expect(card).toHaveAttribute('href', '/disponibilidade/saldo');
    expect(screen.getByTestId('balance-value')).toHaveTextContent('5');
    expect(card).toHaveTextContent('8 dias comunicados em 2026.');
  });

  it('saldo negativo fica em vermelho com a orientação', async () => {
    mock(-2);
    renderWithProviders(<DashboardPage />, { sessionUser: pedro, route: '/disponibilidade' });
    const value = await screen.findByTestId('balance-value');
    expect(value).toHaveTextContent('-2');
    expect(value.className).toContain('text-danger');
    expect(screen.getByText('Saldo negativo: fale com um administrador.')).toBeInTheDocument();
  });
});
