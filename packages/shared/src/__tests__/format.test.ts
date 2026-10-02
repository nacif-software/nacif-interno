import { describe, expect, it } from 'vitest';
import {
  formatBusinessDays,
  formatCompactRange,
  formatDate,
  formatDateRange,
  formatMonthRange,
  formatMonthTitle,
  formatProseRange,
  formatSentDate,
  formatSentOn,
  formatTimestamp,
} from '../date/format';

describe('formatDateRange', () => {
  it('mesmo mês', () => {
    expect(formatDateRange('2026-10-05', '2026-10-09')).toBe('05 – 09 out 2026');
  });
  it('meses diferentes', () => {
    expect(formatDateRange('2026-10-28', '2026-11-03')).toBe('28 out – 03 nov 2026');
  });
  it('anos diferentes', () => {
    expect(formatDateRange('2026-12-28', '2027-01-03')).toBe('28 dez 2026 – 03 jan 2027');
  });
  it('um único dia', () => {
    expect(formatDateRange('2026-10-05', '2026-10-05')).toBe('05 out 2026');
  });
  it('sem ano (mobile)', () => {
    expect(formatDateRange('2026-09-14', '2026-09-18', { withYear: false })).toBe('14 – 18 set');
  });
});

describe('outros formatos', () => {
  it('data simples', () => {
    expect(formatDate('2026-10-05')).toBe('05 out 2026');
  });
  it('compacto e prosa', () => {
    expect(formatCompactRange('2026-10-06', '2026-10-08')).toBe('06–08 out');
    expect(formatProseRange('2026-10-06', '2026-10-08')).toBe('06 a 08 out');
  });
  it('título do mês', () => {
    expect(formatMonthTitle('2026-10')).toBe('Outubro 2026');
  });
  it('intervalo de meses', () => {
    expect(formatMonthRange('2026-09', '2026-10')).toBe('Set – out 2026');
    expect(formatMonthRange('2026-10', '2026-10')).toBe('Out 2026');
  });
  it('timestamp no fuso de São Paulo', () => {
    expect(formatTimestamp('2026-08-21T12:12:00Z')).toBe('21 ago 2026, 09:12');
    expect(formatTimestamp('2026-06-12T20:40:00Z')).toBe('12 jun 2026, 17:40');
  });
  it('enviada em', () => {
    expect(formatSentOn('2026-08-02T15:00:00Z')).toBe('enviada 02 ago');
    expect(formatSentDate('2026-08-20T15:00:00Z')).toBe('20 ago 2026');
  });
  it('dias úteis', () => {
    expect(formatBusinessDays(5)).toBe('5 dias úteis');
    expect(formatBusinessDays(1)).toBe('1 dia útil');
  });
});
