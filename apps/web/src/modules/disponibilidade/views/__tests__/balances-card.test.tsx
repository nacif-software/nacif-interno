import type { BalanceOverviewItem } from '@nacif/shared';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { renderWithProviders } from '@/test/render';
import { BalancesCard } from '../components/balances-card';

const items: BalanceOverviewItem[] = [
  {
    user: { id: 'u-pedro', name: 'Pedro Nakano', initials: 'PN', active: true },
    creditBaseDate: '2025-08-22',
    balance: 5,
    lastEntryDate: '2026-10-06',
  },
  {
    user: { id: 'u-thiago', name: 'Thiago Lemos', initials: 'TL', active: false },
    creditBaseDate: null,
    balance: -2,
    lastEntryDate: null,
  },
];

describe('BalancesCard', () => {
  it('lista saldos com data base e último lançamento; nome leva ao extrato', () => {
    mockApi(() => undefined);
    renderWithProviders(<BalancesCard items={items} />);
    expect(screen.getByRole('link', { name: 'Pedro Nakano' })).toHaveAttribute(
      'href',
      '/disponibilidade/saldo/u-pedro',
    );
    expect(screen.getByText('22 ago 2025')).toBeInTheDocument();
    expect(screen.getByText('06 out 2026')).toBeInTheDocument();
    expect(screen.getByText('-2').className).toContain('text-danger');
  });

  it('lança um crédito com dias, data e nota', async () => {
    const fetchMock = mockApi((url, init) => {
      if (
        url.pathname === '/api/disponibilidade/balance/u-pedro/entries' &&
        init?.method === 'POST'
      )
        return { status: 201, body: { balance: 20 } };
      return undefined;
    });
    renderWithProviders(<BalancesCard items={items} />);
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Lançar crédito' })[0]!);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Pedro Nakano');
    const days = screen.getByLabelText(/^Dias/);
    await user.clear(days);
    await user.type(days, '15');
    await user.type(
      screen.getByLabelText(/^Nota/),
      'Concedido para todos com mais de 2 anos de casa',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Lançar crédito' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const urlOf = (input: RequestInfo | URL) =>
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const call = fetchMock.mock.calls.find(([input]) => urlOf(input).includes('/entries'));
    expect(call).toBeDefined();
    const body = JSON.parse(call![1]?.body as string) as Record<string, unknown>;
    expect(body).toMatchObject({
      type: 'GRANT',
      days: 15,
      note: 'Concedido para todos com mais de 2 anos de casa',
    });
    expect(typeof body.referenceDate).toBe('string');
  });
});

describe('BalancesCard · venda e validação', () => {
  it('registra uma venda e recusa nota curta', async () => {
    const fetchMock = mockApi((url, init) => {
      if (
        url.pathname === '/api/disponibilidade/balance/u-pedro/entries' &&
        init?.method === 'POST'
      )
        return { status: 201, body: { balance: 3 } };
      return undefined;
    });
    renderWithProviders(<BalancesCard items={items} />);
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Registrar venda' })[0]!);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Registrar venda de dias');
    const days = screen.getByLabelText(/^Dias/);
    await user.clear(days);
    await user.type(days, '2');
    await user.type(screen.getByLabelText(/^Nota/), 'curta');
    await user.click(within(dialog).getByRole('button', { name: 'Registrar venda' }));
    expect(await screen.findByText(/pelo menos 10 caracteres/)).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input instanceof Request ? input.url : input).includes('/entries'),
      ),
    ).toBe(false);

    await user.clear(screen.getByLabelText(/^Nota/));
    await user.type(screen.getByLabelText(/^Nota/), 'Venda acordada no fechamento');
    await user.click(within(dialog).getByRole('button', { name: 'Registrar venda' }));
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input instanceof Request ? input.url : input).includes('/entries'),
        ),
      ).toBe(true),
    );
  });

  it('inativos ficam por último e em cinza', () => {
    mockApi(() => undefined);
    renderWithProviders(<BalancesCard items={items} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[rows.length - 1]).toHaveTextContent('Thiago Lemos');
    expect(rows[rows.length - 1]!.className).toContain('opacity-70');
  });
});
