import { z } from 'zod';
import { isoDateSchema, isoMonthSchema } from '../date/iso-date';
import { communicationStatusSchema } from '../enums/communication-status';
import { projectRefSchema } from './common';

export const calendarQuerySchema = z.object({
  month: isoMonthSchema,
  projectId: z.string().optional(),
});
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;

export const calendarBarSchema = z.object({
  communicationId: z.string(),
  code: z.string(),
  status: communicationStatusSchema,
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  businessDays: z.number().int(),
  clampedStart: isoDateSchema,
  clampedEnd: isoDateSchema,
});
export type CalendarBar = z.infer<typeof calendarBarSchema>;

export const calendarRowSchema = z.object({
  user: z.object({ id: z.string(), name: z.string(), initials: z.string() }),
  project: projectRefSchema.nullable(),
  isApprover: z.boolean(),
  bars: z.array(calendarBarSchema),
});
export type CalendarRow = z.infer<typeof calendarRowSchema>;

export const calendarMonthDtoSchema = z.object({
  month: isoMonthSchema,
  days: z.array(z.object({ date: isoDateSchema, weekend: z.boolean() })),
  rows: z.array(calendarRowSchema),
});
export type CalendarMonthDto = z.infer<typeof calendarMonthDtoSchema>;
