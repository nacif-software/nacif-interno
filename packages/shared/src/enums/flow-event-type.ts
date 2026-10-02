import { z } from 'zod';

export const FLOW_EVENT_TYPES = [
  'SUBMITTED',
  'IN_REVIEW',
  'DECISION',
  'CANCELLED',
  'EDITED',
  'DECISION_REVERTED',
] as const;
export const flowEventTypeSchema = z.enum(FLOW_EVENT_TYPES);
export type FlowEventType = z.infer<typeof flowEventTypeSchema>;
