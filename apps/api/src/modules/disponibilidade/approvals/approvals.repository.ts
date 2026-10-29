import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { approvalBatches, communications, decisions } from '../../../db/schema';

export interface DecisionInput {
  id: string;
  communicationId: string;
  type: 'APPROVED' | 'REJECTED';
  deciderId: string;
  decidedAt: Date;
  justification: string | null;
  batchId: string | null;
}

export const approvalsRepository = {
  /** Builder para compor em `batch()`. */
  insertBatch(data: { id: string; approverId: string; undoableUntil: Date }) {
    return db().insert(approvalBatches).values(data);
  },

  findBatchWithDecisions(batchId: string) {
    return db().query.approvalBatches.findFirst({
      where: eq(approvalBatches.id, batchId),
      with: { decisions: { where: isNull(decisions.revertedAt), with: { communication: true } } },
    });
  },

  /** Builder: fecha o lote só se ainda estiver aberto; `returning` vazio = já desfeito. */
  closeBatch(batchId: string, undoneAt: Date) {
    return db()
      .update(approvalBatches)
      .set({ undoneAt })
      .where(and(eq(approvalBatches.id, batchId), isNull(approvalBatches.undoneAt)))
      .returning({ id: approvalBatches.id });
  },

  /**
   * Builder: grava a decisão só se a comunicação está no status desta decisão e não há decisão
   * vigente. Assim a requisição que perdeu a corrida (ou disputou com um cancelamento) não deixa
   * uma decisão órfã. (As colunas seguem a ordem da tabela em `schema.ts`.)
   */
  insertDecisionIfWon(input: DecisionInput) {
    return db()
      .insert(decisions)
      .select(
        sql`select ${input.id}, ${input.communicationId}, ${input.type}, ${input.deciderId},
        ${input.decidedAt.toISOString()}, ${input.justification}, ${input.batchId}, null
        where exists (
          select 1 from ${communications}
          where ${communications.id} = ${input.communicationId} and ${communications.status} = ${input.type}
        )
        and not exists (
          select 1 from ${decisions}
          where ${decisions.communicationId} = ${input.communicationId} and ${decisions.revertedAt} is null
        )`,
      );
  },

  /** Builder: reverte a decisão só se ainda não foi revertida. */
  revertDecision(decisionId: string, revertedAt: Date) {
    return db()
      .update(decisions)
      .set({ revertedAt })
      .where(and(eq(decisions.id, decisionId), isNull(decisions.revertedAt)))
      .returning({ id: decisions.id });
  },
};
