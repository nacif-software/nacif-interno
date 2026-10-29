import { db } from '../../../db/client';
import { flowEvents, type FlowEventMetadata } from '../../../db/schema';
import type { FlowEvent } from '../../../db/types';

export interface FlowEventInput {
  communicationId: string;
  type: FlowEvent['type'];
  actorId: string | null;
  occurredAt: Date;
  description: string;
  metadata?: FlowEventMetadata;
}

export const flowEventsRepository = {
  /** Builder para compor em `batch()`. */
  insert(input: FlowEventInput) {
    return db()
      .insert(flowEvents)
      .values({ ...input, metadata: input.metadata ?? null });
  },
};
