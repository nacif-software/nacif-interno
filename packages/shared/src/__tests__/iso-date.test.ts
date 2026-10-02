import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  daysInMonth,
  isValidIsoDate,
  isoDayOfWeek,
  monthEnd,
  todayIso,
} from '../date/iso-date';

describe('iso-date', () => {
  it('valida datas reais', () => {
    expect(isValidIsoDate('2026-02-29')).toBe(false);
    expect(isValidIsoDate('2028-02-29')).toBe(true);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
  });
  it('soma dias cruzando ano', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
  it('navega meses', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(daysInMonth('2026-10')).toBe(31);
    expect(monthEnd('2026-02')).toBe('2026-02-28');
  });
  it('outubro de 2026 começa numa quinta', () => {
    expect(isoDayOfWeek('2026-10-01')).toBe(4);
  });
  it('calcula hoje no fuso de São Paulo', () => {
    // 2026-09-23T02:30Z é 22/09 às 23:30 em São Paulo (UTC-3)
    expect(todayIso('America/Sao_Paulo', new Date('2026-09-23T02:30:00Z'))).toBe('2026-09-22');
    expect(todayIso('UTC', new Date('2026-09-23T02:30:00Z'))).toBe('2026-09-23');
  });
});
