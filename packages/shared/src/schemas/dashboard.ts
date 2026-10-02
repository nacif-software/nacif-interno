import { z } from 'zod';
import { isoDateSchema } from '../date/iso-date';
import { communicationStatusSchema } from '../enums/communication-status';
import { communicationSummaryDtoSchema } from './communication';

export const dashboardDtoSchema = z.object({
  year: z.number().int(),
  daysCommunicatedInYear: z.number().int(),
  inReviewCount: z.number().int(),
  inReviewApproverName: z.string().nullable(),
  nextUnavailability: z
    .object({
      code: z.string(),
      startDate: isoDateSchema,
      endDate: isoDateSchema,
      businessDays: z.number().int(),
      status: communicationStatusSchema,
    })
    .nullable(),
  recent: z.array(communicationSummaryDtoSchema),
});
export type DashboardDto = z.infer<typeof dashboardDtoSchema>;
