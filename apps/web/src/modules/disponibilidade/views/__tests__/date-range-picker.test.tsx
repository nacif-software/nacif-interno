import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { DateRangePicker } from '../components/date-range-picker';

function Harness() {
  const [range, setRange] = useState<{ startDate?: string; endDate?: string }>({});
  return (
    <DateRangePicker
      minDate="2026-10-03"
      startDate={range.startDate}
      endDate={range.endDate}
      onChange={setRange}
    />
  );
}

describe('DateRangePicker', () => {
  it('desabilita dias passados e conta dias úteis do intervalo', async () => {
    render(<Harness />);
    const user = userEvent.setup();
    expect(screen.getByText('Outubro 2026')).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: '01 out 2026' })).toBeDisabled();
    await user.click(screen.getByRole('gridcell', { name: '05 out 2026' }));
    await user.click(screen.getByRole('gridcell', { name: '09 out 2026' }));
    expect(screen.getByText('05 out 2026')).toBeInTheDocument();
    expect(screen.getByText('09 out 2026')).toBeInTheDocument();
    expect(screen.getByText('5 dias úteis')).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: '07 out 2026' })).toHaveClass('bg-brand-wash');
    expect(screen.getByRole('gridcell', { name: '05 out 2026' })).toHaveClass('bg-brand');
  });

  it('permite intervalo cruzando meses pela navegação', async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('gridcell', { name: '28 out 2026' }));
    await user.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(screen.getByText('Novembro 2026')).toBeInTheDocument();
    await user.click(screen.getByRole('gridcell', { name: '03 nov 2026' }));
    expect(screen.getByText('28 out 2026')).toBeInTheDocument();
    expect(screen.getByText('03 nov 2026')).toBeInTheDocument();
    expect(screen.getByText('5 dias úteis')).toBeInTheDocument();
  });
});
