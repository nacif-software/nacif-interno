import { isoDateYear, type IsoDate } from './iso-date';

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Aniversário de `base` no ano dado; 29/02 vira 28/02 em ano comum. */
export function anniversaryOn(base: IsoDate, year: number): IsoDate {
  const monthDay = base.slice(5);
  const day = monthDay === '02-29' && !isLeapYear(year) ? '02-28' : monthDay;
  return `${year}-${day}`;
}

/**
 * Anos cujo aniversário da data base já passou (ou é hoje) e ainda não foi creditado.
 * O primeiro crédito acontece no primeiro aniversário, nunca na própria data base.
 */
export function pendingAnniversaryYears(
  base: IsoDate,
  today: IsoDate,
  creditedYears: Iterable<number> = [],
): number[] {
  const credited = new Set(creditedYears);
  const years: number[] = [];
  for (let year = isoDateYear(base) + 1; year <= isoDateYear(today); year++) {
    if (anniversaryOn(base, year) <= today && !credited.has(year)) years.push(year);
  }
  return years;
}
