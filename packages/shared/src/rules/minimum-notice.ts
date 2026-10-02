import { addDays, compareIsoDates, type IsoDate } from '../date/iso-date';

export interface MinimumNoticeInput {
  startDate: IsoDate;
  /** Data de hoje no fuso da aplicação. */
  today: IsoDate;
  minNoticeDays: number;
}

export type MinimumNoticeResult =
  { ok: true } | { ok: false; earliestStart: IsoDate; minNoticeDays: number };

/** O início deve ser em `today + minNoticeDays` ou depois. */
export function validateMinimumNotice(input: MinimumNoticeInput): MinimumNoticeResult {
  const earliestStart = addDays(input.today, input.minNoticeDays);
  if (compareIsoDates(input.startDate, earliestStart) >= 0) return { ok: true };
  return { ok: false, earliestStart, minNoticeDays: input.minNoticeDays };
}
