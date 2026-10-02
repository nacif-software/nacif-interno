import { z } from 'zod';

export const DECISION_TYPES = ['APPROVED', 'REJECTED'] as const;
export const decisionTypeSchema = z.enum(DECISION_TYPES);
export type DecisionType = z.infer<typeof decisionTypeSchema>;
