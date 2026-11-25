import { MESSAGES } from '@nacif/shared';
import { describe, expect, it } from 'vitest';
import { flowToTimeline } from '..';

const base = { id: 'e1', occurredAt: '2026-11-21T03:00:00.000Z', actor: null };

describe('flowToTimeline', () => {
  it('recontagem pelo calendário de feriados não aparece como período editado', () => {
    const [step] = flowToTimeline(
      [
        {
          ...base,
          type: 'EDITED',
          description: MESSAGES.holidayRecountEvent(5, 4),
          metadata: { recount: { previousBusinessDays: 5, businessDays: 4 } },
        },
      ],
      'APPROVED',
    );
    expect(step?.title).toBe(MESSAGES.holidayRecountTitle);
    expect(step?.detail).toContain(MESSAGES.holidayRecountEvent(5, 4));
  });

  it('edição de período pelo autor continua como período editado', () => {
    const [step] = flowToTimeline(
      [
        {
          ...base,
          type: 'EDITED',
          description: 'Período alterado',
          metadata: { previous: { startDate: '2026-12-07', endDate: '2026-12-11' } },
        },
      ],
      'IN_REVIEW',
    );
    expect(step?.title).toBe('Período editado');
  });
});
