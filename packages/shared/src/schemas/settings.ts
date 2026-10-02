import { z } from 'zod';
import { personRefSchema } from './common';

export const settingsDtoSchema = z.object({
  minNoticeDays: z.number().int().min(0),
  maxSimultaneousPerProject: z.number().int().min(1),
  defaultApprovers: z.array(personRefSchema),
});
export type SettingsDto = z.infer<typeof settingsDtoSchema>;

export const updateSettingsBodySchema = z.object({
  minNoticeDays: z.coerce.number().int().min(0).max(365),
  maxSimultaneousPerProject: z.coerce.number().int().min(1).max(100),
  defaultApproverIds: z.array(z.string()).max(20),
});
export type UpdateSettingsBody = z.infer<typeof updateSettingsBodySchema>;
