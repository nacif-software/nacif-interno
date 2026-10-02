import type { CommunicationSummaryDto } from '@nacif/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CommunicationList } from '../components/communication-list';

const base: Omit<
  CommunicationSummaryDto,
  'id' | 'code' | 'status' | 'decision' | 'cancelledAt' | 'startDate' | 'endDate' | 'businessDays'
> = {
  submittedAt: '2026-08-02T15:00:00Z',
  author: { id: 'u1', name: 'Marina Duarte' },
  cover: { id: 'u2', name: 'Pedro Nakano' },
  approver: { id: 'u3', name: 'Caio Bertelli' },
  project: { id: 'p1', name: 'Órion' },
};

const items: CommunicationSummaryDto[] = [
  {
    ...base,
    id: '1',
    code: '2026-0172',
    startDate: '2026-09-14',
    endDate: '2026-09-18',
    businessDays: 5,
    status: 'APPROVED',
    decision: null,
    cancelledAt: null,
  },
  {
    ...base,
    id: '2',
    code: '2026-0160',
    startDate: '2026-07-02',
    endDate: '2026-07-04',
    businessDays: 3,
    status: 'REJECTED',
    cancelledAt: null,
    decision: {
      type: 'REJECTED',
      decider: { id: 'u3', name: 'Caio Bertelli' },
      decidedAt: '2026-06-12T20:40:00Z',
      justification: 'Sobreposição com entrega do projeto Órion.',
    },
  },
  {
    ...base,
    id: '3',
    code: '2026-0151',
    startDate: '2026-05-18',
    endDate: '2026-05-22',
    businessDays: 5,
    status: 'CANCELLED',
    decision: null,
    cancelledAt: '2026-05-10T13:00:00Z',
  },
];

describe('CommunicationList', () => {
  it('monta título, subtítulo por status e data de envio como no design', () => {
    renderWithProviders(<CommunicationList items={items} />);
    expect(screen.getByText('14 – 18 set 2026 · 5 dias úteis')).toBeInTheDocument();
    expect(
      screen.getByText('Cobertura: Pedro Nakano · Aprovador: Caio Bertelli'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Recusada por Caio Bertelli: sobreposição com entrega do projeto Órion.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Cancelada pelo autor em 10 mai.')).toBeInTheDocument();
    expect(screen.getAllByText('enviada 02 ago')).toHaveLength(3);
  });
});
