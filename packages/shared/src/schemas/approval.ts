import { z } from 'zod';
import { JUSTIFICATION_MAX_CHARS, REJECTION_MIN_CHARS } from '../constants';
import { isoMonthSchema } from '../date/iso-date';
import { communicationStatusSchema } from '../enums/communication-status';
import { MESSAGES } from '../labels/pt-br';
import { paginationQuerySchema } from './common';
import { communicationSummaryDtoSchema } from './communication';

export const approvalsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['IN_REVIEW', 'APPROVED', 'REJECTED']).default('IN_REVIEW'),
  from: isoMonthSchema.optional(),
  to: isoMonthSchema.optional(),
  projectId: z.string().optional(),
});
export type ApprovalsQuery = z.infer<typeof approvalsQuerySchema>;

export const queueItemDtoSchema = communicationSummaryDtoSchema.extend({
  hasConflicts: z.boolean(),
});
export type QueueItemDto = z.infer<typeof queueItemDtoSchema>;

export const approvalsResultSchema = z.object({
  items: z.array(queueItemDtoSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  counts: z.object({
    inReview: z.number().int(),
    approved: z.number().int(),
    rejected: z.number().int(),
  }),
});
export type ApprovalsResult = z.infer<typeof approvalsResultSchema>;

export const rejectBodySchema = z.object({
  justification: z
    .string()
    .trim()
    .min(REJECTION_MIN_CHARS, { error: MESSAGES.rejectionTooShort })
    .max(JUSTIFICATION_MAX_CHARS),
});
export type RejectBody = z.infer<typeof rejectBodySchema>;

export const batchApproveBodySchema = z.object({
  communicationIds: z.array(z.string().min(1)).min(1).max(100),
});
export type BatchApproveBody = z.infer<typeof batchApproveBodySchema>;

export const batchApproveResultSchema = z.object({
  batchId: z.string(),
  approvedCount: z.number().int(),
  skipped: z.array(z.string()),
  undoableUntil: z.string(),
});
export type BatchApproveResult = z.infer<typeof batchApproveResultSchema>;

export const batchUndoResultSchema = z.object({
  revertedCount: z.number().int(),
});
export type BatchUndoResult = z.infer<typeof batchUndoResultSchema>;

export { communicationStatusSchema as queueStatusSchema };
