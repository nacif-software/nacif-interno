import type { DateRange } from '../date/business-days';

/** Intervalos inclusivos se sobrepõem quando nenhum termina antes do outro começar. */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

export function findOverlaps<T extends DateRange>(range: DateRange, candidates: readonly T[]): T[] {
  return candidates.filter((c) => rangesOverlap(range, c));
}
