import {
  addDays,
  compareIsoDates,
  isoDayOfWeek,
  maxIsoDate,
  minIsoDate,
  type IsoDate,
} from './iso-date';

export interface DateRange {
  startDate: IsoDate;
  endDate: IsoDate;
}

export function isWeekend(iso: IsoDate): boolean {
  const dow = isoDayOfWeek(iso);
  return dow === 0 || dow === 6;
}

/** Lista inclusiva de dias entre start e end. Vazia se end < start. */
export function eachDay(startDate: IsoDate, endDate: IsoDate): IsoDate[] {
  const days: IsoDate[] = [];
  if (compareIsoDates(startDate, endDate) > 0) return days;
  let cursor = startDate;
  while (compareIsoDates(cursor, endDate) <= 0) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

/**
 * Dias úteis (segunda a sexta) no intervalo inclusivo.
 * Feriados não são considerados (ver docs/issues/004-feriados.md).
 */
export function countBusinessDays(startDate: IsoDate, endDate: IsoDate): number {
  return eachDay(startDate, endDate).filter((d) => !isWeekend(d)).length;
}

/** Recorta `range` aos limites de `bounds`; null se não houver interseção. */
export function clampRange(range: DateRange, bounds: DateRange): DateRange | null {
  const startDate = maxIsoDate(range.startDate, bounds.startDate);
  const endDate = minIsoDate(range.endDate, bounds.endDate);
  if (compareIsoDates(startDate, endDate) > 0) return null;
  return { startDate, endDate };
}
