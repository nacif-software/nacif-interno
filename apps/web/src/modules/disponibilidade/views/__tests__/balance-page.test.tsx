import type { BalanceDto, SessionUser } from '@nacif/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { renderWithProviders } from '@/test/render';
import { BalancePage } from '../pages/balance-page';

const pedro: SessionUser = {
  id: 'u-pedro',
  name: 'Pedro Nakano',
  initials: 'PN',
  email: 'pedro@nacif.xyz',
  role: 'MEMBER',
  active: true,
  projects: [{ id: 'p1', name: 'Órion' }],
};

const balance: BalanceDto = {
  user: { id: 'u-pedro', name: 'Pedro Nakano' },
  creditBaseDate: '2025-08-22',
  balance: -2,
  credits: 10,
  sales: 7,
  deducted: 5,
  entries: [
    {
      id: 'communication:c1',
      kind: 'COMMUNICATION',
      date: '2026-02-02',
      days: -5,
      note: null,
      createdBy: null,
      communication: {
        id: 'c1',
        code: '2026-0190',
        startDate: '2026-02-02',
        endDate: '2026-02-06',
      },
      runningBalance: -2,
    },
    {
      id: 'l2',
      kind: 'SALE',
      date: '2025-10-15',
      days: -7,
      note: 'Venda acordada em outubro',
      createdBy: { id: 'u-caio', name: 'Caio Bertelli' },
      communication: null,
      runningBalance: 3,
    },
    {
      id: 'l1',
      kind: 'GRANT',
      date: '2025-08-22',
      days: 10,
      note: 'Concedido para todos com mais de 1 ano de casa',
      createdBy: { id: 'u-caio', name: 'Caio Bertelli' },
      communication: null,
      runningBalance: 10,
    },
  ],
};

describe('BalancePage', () => {
  it('mostra saldo, totais e o extrato com saldo acumulado', async () => {
    mockApi((url) =>
      url.pathname === '/api/disponibilidade/balance' ? { body: balance } : undefined,
    );
    renderWithProviders(<BalancePage />, { sessionUser: pedro, route: '/disponibilidade/saldo' });

    expect(await screen.findByRole('heading', { name: 'Meu saldo' })).toBeInTheDocument();
    expect(screen.getByText('Data base do crédito: 22 ago 2025.')).toBeInTheDocument();
    expect(screen.getByText('Saldo negativo: fale com um administrador.')).toBeInTheDocument();
    expect(screen.getByText('Indisponibilidade 02 – 06 fev')).toHaveAttribute(
      'href',
      '/disponibilidade/comunicacoes/2026-0190',
    );
    expect(screen.getByText('Venda de dias')).toBeInTheDocument();
    expect(screen.getByText('Venda acordada em outubro')).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByText('-7')).toBeInTheDocument();
  });

  it('sem lançamentos mostra o estado vazio', async () => {
    mockApi((url) =>
      url.pathname === '/api/disponibilidade/balance'
        ? {
            body: {
              ...balance,
              balance: 0,
              credits: 0,
              sales: 0,
              deducted: 0,
              entries: [],
              creditBaseDate: null,
            },
          }
        : undefined,
    );
    renderWithProviders(<BalancePage />, { sessionUser: pedro, route: '/disponibilidade/saldo' });
    expect(await screen.findByText('Nenhum lançamento ainda')).toBeInTheDocument();
    expect(
      screen.getByText('Sem data base do crédito: nenhum crédito anual automático.'),
    ).toBeInTheDocument();
  });
});
