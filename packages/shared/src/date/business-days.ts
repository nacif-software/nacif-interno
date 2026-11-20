import {
  addDays,
  compareIsoDates,
  isoDateYear,
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

/** Conjunto vazio: contagem só com fim de semana (histórico importado, seed). */
export const NO_HOLIDAYS: ReadonlySet<IsoDate> = Object.freeze(new Set<IsoDate>());

/** Dia útil: segunda a sexta e fora do calendário de feriados da Nacif. */
export function isBusinessDay(iso: IsoDate, holidays: ReadonlySet<IsoDate> = NO_HOLIDAYS): boolean {
  return !isWeekend(iso) && !holidays.has(iso);
}

/** Dias úteis no intervalo inclusivo, descontando fim de semana e os feriados informados. */
export function countBusinessDays(
  startDate: IsoDate,
  endDate: IsoDate,
  holidays: ReadonlySet<IsoDate> = NO_HOLIDAYS,
): number {
  return eachDay(startDate, endDate).filter((d) => isBusinessDay(d, holidays)).length;
}

/**
 * Anos do período sem nenhum feriado cadastrado: o calendário daquele ano ainda não foi definido
 * e a contagem de dias úteis pode mudar quando for.
 */
export function yearsWithoutHolidays(range: DateRange, holidays: ReadonlySet<IsoDate>): number[] {
  const covered = new Set([...holidays].map(isoDateYear));
  const years: number[] = [];
  for (let y = isoDateYear(range.startDate); y <= isoDateYear(range.endDate); y++) {
    if (!covered.has(y)) years.push(y);
  }
  return years;
}

/** Recorta `range` aos limites de `bounds`; null se não houver interseção. */
export function clampRange(range: DateRange, bounds: DateRange): DateRange | null {
  const startDate = maxIsoDate(range.startDate, bounds.startDate);
  const endDate = minIsoDate(range.endDate, bounds.endDate);
  if (compareIsoDates(startDate, endDate) > 0) return null;
  return { startDate, endDate };
}
