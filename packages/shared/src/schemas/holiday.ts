import { z } from 'zod';
import { isoDateSchema } from '../date/iso-date';
import { MESSAGES } from '../labels/pt-br';

export const holidayDtoSchema = z.object({
  id: z.string(),
  date: isoDateSchema,
  name: z.string(),
});
export type HolidayDto = z.infer<typeof holidayDtoSchema>;

export const createHolidayBodySchema = z.object({
  date: isoDateSchema,
  name: z.string().trim().min(2, { error: MESSAGES.holidayNameTooShort }).max(80),
});
export type CreateHolidayBody = z.infer<typeof createHolidayBodySchema>;
