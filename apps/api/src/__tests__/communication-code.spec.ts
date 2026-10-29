import { addDays, todayIso, APP_TIMEZONE } from '@nacif/shared';
import { describe, expect, it } from 'vitest';
import { communicationsService } from '../modules/disponibilidade/communications/communications.service';
import { seedTeam } from '../test/factories';

/** Próxima segunda-feira com pelo menos 7 dias de antecedência. */
function nextMonday(from: string): string {
  let date = addDays(from, 7);
  while (new Date(`${date}T00:00:00Z`).getUTCDay() !== 1) date = addDays(date, 1);
  return date;
}

describe('código da comunicação', () => {
  it('envios concorrentes recebem códigos únicos e sequenciais', async () => {
    const { pedro, marina, caio } = await seedTeam();
    const monday = nextMonday(todayIso(APP_TIMEZONE));
    const body = {
      startDate: monday,
      endDate: addDays(monday, 2),
      coverId: marina.id,
      approverId: caio.id,
    };
    const created = await Promise.all(
      Array.from({ length: 10 }, () => communicationsService.create(pedro, body)),
    );
    const codes = created.map((c) => c.code).sort();
    expect(new Set(codes).size).toBe(10);
    const year = monday.slice(0, 4);
    expect(codes).toEqual(
      Array.from({ length: 10 }, (_, i) => `${year}-${String(i + 1).padStart(4, '0')}`),
    );
  });
});
