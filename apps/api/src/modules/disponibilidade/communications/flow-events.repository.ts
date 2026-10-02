import type { FlowEventType, Prisma } from '../../../generated/prisma/client';
import type { DbOrTx } from '../../../infra/prisma/client';

export interface FlowEventInput {
  communicationId: string;
  type: FlowEventType;
  actorId: string | null;
  occurredAt: Date;
  description: string;
  metadata?: Prisma.InputJsonValue;
}

export const flowEventsRepository = {
  create(input: FlowEventInput, tx: DbOrTx) {
    return tx.flowEvent.create({ data: { ...input, metadata: input.metadata ?? undefined } });
  },
};
