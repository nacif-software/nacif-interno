import { describe, expect, it } from 'vitest';
import { clampRange, countBusinessDays, eachDay, isWeekend } from '../date/business-days';

describe('countBusinessDays', () => {
  it('conta segunda a sexta dentro da mesma semana', () => {
    expect(countBusinessDays('2026-09-14', '2026-09-18')).toBe(5);
  });
  it('ignora fim de semana ao cruzar meses', () => {
    expect(countBusinessDays('2026-10-28', '2026-11-03')).toBe(5);
  });
  it('conta dois dias', () => {
    expect(countBusinessDays('2026-11-09', '2026-11-10')).toBe(2);
  });
  it('conta duas semanas completas', () => {
    expect(countBusinessDays('2026-11-16', '2026-11-27')).toBe(10);
  });
  it('retorna zero para fim de semana', () => {
    expect(countBusinessDays('2026-10-03', '2026-10-04')).toBe(0);
  });
  it('retorna um para um único dia útil', () => {
    expect(countBusinessDays('2026-10-05', '2026-10-05')).toBe(1);
  });
  it('retorna zero quando fim antes do início', () => {
    expect(countBusinessDays('2026-10-09', '2026-10-05')).toBe(0);
  });
});

describe('isWeekend / eachDay / clampRange', () => {
  it('identifica sábado e domingo', () => {
    expect(isWeekend('2026-10-03')).toBe(true);
    expect(isWeekend('2026-10-04')).toBe(true);
    expect(isWeekend('2026-10-05')).toBe(false);
  });
  it('lista dias inclusivos', () => {
    expect(eachDay('2026-10-30', '2026-11-01')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
  });
  it('recorta ao mês', () => {
    expect(
      clampRange(
        { startDate: '2026-10-28', endDate: '2026-11-03' },
        { startDate: '2026-10-01', endDate: '2026-10-31' },
      ),
    ).toEqual({ startDate: '2026-10-28', endDate: '2026-10-31' });
    expect(
      clampRange(
        { startDate: '2026-11-09', endDate: '2026-11-10' },
        { startDate: '2026-10-01', endDate: '2026-10-31' },
      ),
    ).toBeNull();
  });
});
