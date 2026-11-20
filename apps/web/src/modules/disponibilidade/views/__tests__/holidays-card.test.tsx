import { MESSAGES, type HolidayDto } from '@nacif/shared';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { renderWithProviders } from '@/test/render';
import { HolidaysCard } from '../components/holidays-card';

const holidays: HolidayDto[] = [
  { id: 'h1', date: '2026-12-25', name: 'Natal' },
  { id: 'h2', date: '2027-01-01', name: 'Confraternização Universal' },
];

describe('HolidaysCard', () => {
  it('lista feriados com data e nome', () => {
    mockApi(() => undefined);
    renderWithProviders(<HolidaysCard holidays={holidays} />);
    expect(screen.getByText(MESSAGES.holidaysHint)).toBeInTheDocument();
    expect(screen.getByText('Natal')).toBeInTheDocument();
    expect(screen.getByText('25 dez 2026')).toBeInTheDocument();
    expect(screen.getByText('Confraternização Universal')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: MESSAGES.holidayRemove })).toHaveLength(2);
  });

  it('mostra o estado vazio', () => {
    mockApi(() => undefined);
    renderWithProviders(<HolidaysCard holidays={[]} />);
    expect(screen.getByText(MESSAGES.holidaysEmpty)).toBeInTheDocument();
  });

  it('não envia nome curto', async () => {
    const fetchMock = mockApi(() => undefined);
    renderWithProviders(<HolidaysCard holidays={[]} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Data/), '2026-12-24');
    await user.type(screen.getByLabelText(/^Nome/), 'N');
    await user.click(screen.getByRole('button', { name: MESSAGES.holidayAdd }));
    expect(await screen.findByText(MESSAGES.holidayNameTooShort)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
