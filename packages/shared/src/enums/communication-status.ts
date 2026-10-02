import { z } from 'zod';

export const COMMUNICATION_STATUSES = ['IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
export const communicationStatusSchema = z.enum(COMMUNICATION_STATUSES);
export type CommunicationStatus = z.infer<typeof communicationStatusSchema>;
