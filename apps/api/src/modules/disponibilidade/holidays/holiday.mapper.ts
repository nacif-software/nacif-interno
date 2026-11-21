import type { HolidayDto } from '@nacif/shared';
import type { Holiday } from '../../../db/types';

export function toHolidayDto(row: Holiday): HolidayDto {
  return { id: row.id, date: row.date, name: row.name };
}
