import { z } from 'zod';
import { NOTES_MAX_CHARS } from '../constants';
import { countBusinessDays } from '../date/business-days';
import { isoDateSchema } from '../date/iso-date';
import { communicationStatusSchema } from '../enums/communication-status';
import { decisionTypeSchema } from '../enums/decision-type';
import { flowEventTypeSchema } from '../enums/flow-event-type';
import { MESSAGES } from '../labels/pt-br';
import { paginationQuerySchema, personRefSchema, projectRefSchema } from './common';

export const dateRangeSchema = z
  .object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  })
  .refine((r) => r.endDate >= r.startDate, { error: MESSAGES.endBeforeStart, path: ['endDate'] })
  .refine((r) => countBusinessDays(r.startDate, r.endDate) >= 1, {
    error: MESSAGES.noBusinessDays,
    path: ['endDate'],
  });

export const createCommunicationBodySchema = z
  .object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    coverId: z.string().min(1, { error: MESSAGES.coverRequired }),
    approverId: z.string().min(1, { error: MESSAGES.approverRequired }),
    notes: z.string().trim().max(NOTES_MAX_CHARS).optional(),
  })
  .refine((r) => r.endDate >= r.startDate, { error: MESSAGES.endBeforeStart, path: ['endDate'] })
  .refine((r) => countBusinessDays(r.startDate, r.endDate) >= 1, {
    error: MESSAGES.noBusinessDays,
    path: ['endDate'],
  });
export type CreateCommunicationBody = z.infer<typeof createCommunicationBodySchema>;

export const updatePeriodBodySchema = dateRangeSchema;
export type UpdatePeriodBody = z.infer<typeof updatePeriodBodySchema>;

export const conflictsQuerySchema = z.object({
  startDate: isoDateSchema,
  endDate: isoDateSchema,
});
export type ConflictsQuery = z.infer<typeof conflictsQuerySchema>;

export const conflictDtoSchema = z.object({
  userId: z.string(),
  name: z.string(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  status: communicationStatusSchema,
});
export type ConflictDto = z.infer<typeof conflictDtoSchema>;

export const conflictsResultSchema = z.object({
  conflicts: z.array(conflictDtoSchema),
  limitReached: z.boolean(),
  projectName: z.string().nullable(),
});
export type ConflictsResult = z.infer<typeof conflictsResultSchema>;

export const decisionDtoSchema = z.object({
  type: decisionTypeSchema,
  decider: personRefSchema,
  decidedAt: z.string(),
  justification: z.string().nullable(),
});
export type DecisionDto = z.infer<typeof decisionDtoSchema>;

export const communicationSummaryDtoSchema = z.object({
  id: z.string(),
  code: z.string(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  businessDays: z.number().int(),
  status: communicationStatusSchema,
  submittedAt: z.string(),
  cancelledAt: z.string().nullable(),
  author: personRefSchema,
  cover: personRefSchema,
  approver: personRefSchema,
  project: projectRefSchema,
  decision: decisionDtoSchema.nullable(),
});
export type CommunicationSummaryDto = z.infer<typeof communicationSummaryDtoSchema>;

export const flowEventDtoSchema = z.object({
  id: z.string(),
  type: flowEventTypeSchema,
  actor: personRefSchema.nullable(),
  occurredAt: z.string(),
  description: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});
export type FlowEventDto = z.infer<typeof flowEventDtoSchema>;

export const communicationPermissionsSchema = z.object({
  canCancel: z.boolean(),
  canEditPeriod: z.boolean(),
  canDecide: z.boolean(),
});
export type CommunicationPermissions = z.infer<typeof communicationPermissionsSchema>;

export const communicationDetailDtoSchema = communicationSummaryDtoSchema.extend({
  notes: z.string().nullable(),
  flow: z.array(flowEventDtoSchema),
  conflicts: z.array(conflictDtoSchema),
  permissions: communicationPermissionsSchema,
});
export type CommunicationDetailDto = z.infer<typeof communicationDetailDtoSchema>;

export const communicationsListQuerySchema = paginationQuerySchema.extend({
  status: communicationStatusSchema.optional(),
});
export type CommunicationsListQuery = z.infer<typeof communicationsListQuerySchema>;
