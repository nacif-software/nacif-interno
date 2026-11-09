import type { CommunicationSummaryDto } from '@nacif/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { AdjustDeductionModal } from '../components/adjust-deduction-modal';

const communication: CommunicationSummaryDto = {
  id: 'c1',
  code: '2026-0184',
  startDate: '2026-10-05',
  endDate: '2026-10-06',
  businessDays: 2,
  deductedDays: null,
  status: 'IN_REVIEW',
  submittedAt: '2026-08-20T12:00:00Z',
  cancelledAt: null,
  author: { id: 'u1', name: 'Pedro Nakano' },
  cover: { id: 'u2', name: 'Marina Duarte' },
  approver: { id: 'u3', name: 'Caio Bertelli' },
  projects: [{ id: 'p1', name: 'Órion' }],
  decision: null,
};

describe('AdjustDeductionModal', () => {
  it('exige motivo e envia dias descontados + nota', async () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <AdjustDeductionModal
        communication={communication}
        open
        onClose={() => {}}
        onConfirm={onConfirm}
        loading={false}
      />,
    );
    const user = userEvent.setup();
    const days = screen.getByLabelText(/Dias descontados/);
    await user.clear(days);
    await user.type(days, '0');
    expect(screen.getByRole('button', { name: 'Aprovar com 0 dias' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Aprovar com 0 dias' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(await screen.findByText(/pelo menos 10 caracteres/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Motivo do ajuste/), 'Troca do feriado de 16 e 17');
    await user.click(screen.getByRole('button', { name: 'Aprovar com 0 dias' }));
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith({
        deductedDays: 0,
        deductionNote: 'Troca do feriado de 16 e 17',
      }),
    );
  });
});
