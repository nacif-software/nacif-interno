import { sql, type SQL } from 'drizzle-orm';
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

  /**
   * Builder que só grava o evento se `condition` valer no momento do batch. Usado depois de um
   * UPDATE com guard: se a requisição perdeu a corrida, o evento não entra.
   * (As colunas seguem a ordem da tabela em `schema.ts`.)
   */
  insertIf(input: FlowEventInput, condition: SQL) {
    const metadata = input.metadata ? JSON.stringify(input.metadata) : null;
    return db()
      .insert(flowEvents)
      .select(
        sql`select ${crypto.randomUUID()}, ${input.communicationId}, ${input.type}, ${input.actorId},
        ${input.occurredAt.toISOString()}, ${input.description}, ${metadata}
        where ${condition}`,
      );
  },
};
