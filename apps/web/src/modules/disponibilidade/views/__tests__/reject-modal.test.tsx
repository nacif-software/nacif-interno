import { MESSAGES, type CommunicationSummaryDto } from '@nacif/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RejectModal } from '../components/reject-modal';

const communication: CommunicationSummaryDto = {
  id: 'c1',
  code: '2026-0183',
  startDate: '2026-10-12',
  endDate: '2026-10-16',
  businessDays: 5,
  status: 'IN_REVIEW',
  submittedAt: '2026-08-20T12:00:00Z',
  cancelledAt: null,
  author: { id: 'u1', name: 'Pedro Nakano' },
  cover: { id: 'u2', name: 'Marina Duarte' },
  approver: { id: 'u3', name: 'Caio Bertelli' },
  project: { id: 'p1', name: 'Órion' },
  decision: null,
};

describe('RejectModal', () => {
  it('exige justificativa de 20 caracteres e confirma', async () => {
    const onConfirm = vi.fn();
    render(
      <RejectModal
        communication={communication}
        open
        onClose={() => {}}
        onConfirm={onConfirm}
        loading={false}
      />,
    );
    const user = userEvent.setup();
    expect(screen.getByRole('dialog', { name: 'Recusar comunicação' })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Pedro Nakano · 12 – 16 out 2026 · 5 dias úteis\. A justificativa é enviada ao autor\./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(MESSAGES.rejectionHint)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Justificativa/), 'curta demais');
    await user.click(screen.getByRole('button', { name: 'Confirmar recusa' }));
    expect(await screen.findByText(MESSAGES.rejectionTooShort)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/Justificativa/));
    await user.type(
      screen.getByLabelText(/Justificativa/),
      'Coincide com a virada de release do Órion.',
    );
    await user.click(screen.getByRole('button', { name: 'Confirmar recusa' }));
    expect(onConfirm).toHaveBeenCalledWith('Coincide com a virada de release do Órion.');
  });
});
