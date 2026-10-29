import {
  BATCH_UNDO_WINDOW_MS,
  canDecideOn,
  monthEnd,
  monthStart,
  type ApprovalsQuery,
  type ApprovalsResult,
  type BatchApproveResult,
  type BatchUndoResult,
  type CommunicationDetailDto,
} from '@nacif/shared';
import { and, asc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { batchAll } from '../../../db/client';
import { communications, decisions, flowEvents } from '../../../db/schema';
import type { CommunicationRow } from '../../../db/types';
import type { AuthenticatedUser } from '../../../infra/http/context';
import {
  AppError,
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
} from '../../../infra/http/errors';
import { toQueueItemDto } from '../communications/communication.mapper';
import { communicationsRepository } from '../communications/communications.repository';
import { communicationsService } from '../communications/communications.service';
import { flowEventsRepository } from '../communications/flow-events.repository';
import { approvalsRepository } from './approvals.repository';

/** Statements por decisão em `decideStatements`; `batchApprove` e `undoBatch` leem os resultados por esse passo. */
const STATEMENTS_PER_DECISION = 3;

function scopeFor(actor: AuthenticatedUser): SQL | undefined {
  return actor.role === 'ADMIN' ? undefined : eq(communications.approverId, actor.id);
}

async function loadDecidable(actor: AuthenticatedUser, id: string): Promise<CommunicationRow> {
  const row = await communicationsRepository.findById(id);
  if (!row) throw new NotFoundError('Comunicação não encontrada.');
  if (!canDecideOn(actor, row)) throw new ForbiddenError();
  if (row.status !== 'IN_REVIEW') throw new InvalidStateError('Esta comunicação já foi decidida.');
  return row;
}

/**
 * Statements de uma decisão, para um `batch()`: UPDATE com guard de status (`returning` vazio se
 * outra requisição decidiu antes), decisão e evento condicionados a essa mesma vitória.
 */
function decideStatements(
  actor: AuthenticatedUser,
  row: CommunicationRow,
  type: 'APPROVED' | 'REJECTED',
  now: Date,
  options: { justification?: string; batchId?: string } = {},
): BatchItem<'sqlite'>[] {
  const decisionId = crypto.randomUUID();
  const justification = options.justification ?? null;
  const batchId = options.batchId ?? null;
  return [
    communicationsRepository.update(row.id, { status: type }, 'IN_REVIEW'),
    approvalsRepository.insertDecisionIfWon({
      id: decisionId,
      communicationId: row.id,
      type,
      deciderId: actor.id,
      decidedAt: now,
      justification,
      batchId,
    }),
    flowEventsRepository.insertIf(
      {
        communicationId: row.id,
        type: 'DECISION',
        actorId: actor.id,
        occurredAt: now,
        description:
          type === 'APPROVED' ? `Aprovada por ${actor.name}` : `Recusada por ${actor.name}`,
        metadata: { decision: type, justification, batchId },
      },
      sql`exists (select 1 from ${decisions} where ${decisions.id} = ${decisionId})`,
    ),
  ];
}

/** Resultado do UPDATE guardado da i-ésima decisão num batch que começa com `offset` statements. */
function decisionApplied(results: unknown[], offset: number, i: number): boolean {
  const updated = results[offset + i * STATEMENTS_PER_DECISION] as { id: string }[];
  return updated.length > 0;
}

async function decide(
  actor: AuthenticatedUser,
  row: CommunicationRow,
  type: 'APPROVED' | 'REJECTED',
  now: Date,
  options: { justification?: string } = {},
) {
  const results = await batchAll(decideStatements(actor, row, type, now, options));
  if (!decisionApplied(results, 0, 0)) {
    throw new InvalidStateError('Esta comunicação já foi decidida.');
  }
}

export const approvalsService = {
  async queue(actor: AuthenticatedUser, query: ApprovalsQuery): Promise<ApprovalsResult> {
    const base = and(
      scopeFor(actor),
      query.from ? gte(communications.endDate, monthStart(query.from)) : undefined,
      query.to ? lte(communications.startDate, monthEnd(query.to)) : undefined,
      query.projectId ? eq(communications.projectId, query.projectId) : undefined,
    );
    const where = and(base, eq(communications.status, query.status));

    const [rows, total, inReview, approved, rejected] = await Promise.all([
      communicationsRepository.findMany({
        where,
        orderBy: [asc(communications.submittedAt)],
        offset: (query.page - 1) * query.pageSize,
        limit: query.pageSize,
      }),
      communicationsRepository.count(where),
      communicationsRepository.count(and(base, eq(communications.status, 'IN_REVIEW'))),
      communicationsRepository.count(and(base, eq(communications.status, 'APPROVED'))),
      communicationsRepository.count(and(base, eq(communications.status, 'REJECTED'))),
    ]);
    return {
      items: rows.map(toQueueItemDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
      counts: { inReview, approved, rejected },
    };
  },

  async approve(
    actor: AuthenticatedUser,
    id: string,
    now: Date = new Date(),
  ): Promise<CommunicationDetailDto> {
    const row = await loadDecidable(actor, id);
    await decide(actor, row, 'APPROVED', now);
    return communicationsService.getDetail(actor, id);
  },

  async reject(
    actor: AuthenticatedUser,
    id: string,
    justification: string,
    now: Date = new Date(),
  ): Promise<CommunicationDetailDto> {
    const row = await loadDecidable(actor, id);
    await decide(actor, row, 'REJECTED', now, { justification });
    return communicationsService.getDetail(actor, id);
  },

  async batchApprove(
    actor: AuthenticatedUser,
    ids: string[],
    now: Date = new Date(),
  ): Promise<BatchApproveResult> {
    const undoableUntil = new Date(now.getTime() + BATCH_UNDO_WINDOW_MS);
    const batchId = crypto.randomUUID();
    const skipped: string[] = [];
    const eligible: CommunicationRow[] = [];
    for (const id of [...new Set(ids)]) {
      const row = await communicationsRepository.findById(id);
      if (!row || !canDecideOn(actor, row) || row.status !== 'IN_REVIEW') {
        skipped.push(id);
        continue;
      }
      eligible.push(row);
    }
    // Um único batch atômico: o lote e as decisões entram juntos ou não entram.
    const results = await batchAll([
      approvalsRepository.insertBatch({ id: batchId, approverId: actor.id, undoableUntil }),
      ...eligible.flatMap((row) => decideStatements(actor, row, 'APPROVED', now, { batchId })),
    ]);
    const approvedCount = eligible.filter((_, i) => decisionApplied(results, 1, i)).length;
    return {
      batchId,
      approvedCount,
      skipped,
      undoableUntil: undoableUntil.toISOString(),
    };
  },

  async undoBatch(
    actor: AuthenticatedUser,
    batchId: string,
    now: Date = new Date(),
  ): Promise<BatchUndoResult> {
    const batch = await approvalsRepository.findBatchWithDecisions(batchId);
    if (!batch) throw new NotFoundError('Lote não encontrado.');
    if (batch.approverId !== actor.id) throw new ForbiddenError();
    if (batch.undoneAt) throw new InvalidStateError('Este lote já foi desfeito.');
    if (batch.undoableUntil.getTime() < now.getTime()) {
      throw new AppError(409, 'UNDO_WINDOW_EXPIRED', 'O prazo para desfazer este lote terminou.');
    }
    const revertible = batch.decisions.filter((d) => d.communication.status === 'APPROVED');
    // Por decisão: reverte a decisão, volta a comunicação para análise (guard em APPROVED) e
    // registra o evento só se a reversão desta requisição aconteceu.
    const statements: BatchItem<'sqlite'>[] = revertible.flatMap((decision) => [
      approvalsRepository.revertDecision(decision.id, now),
      communicationsRepository.update(
        decision.communicationId,
        { status: 'IN_REVIEW' },
        'APPROVED',
      ),
      flowEventsRepository.insertIf(
        {
          communicationId: decision.communicationId,
          type: 'DECISION_REVERTED',
          actorId: actor.id,
          occurredAt: now,
          description: `Aprovação em lote desfeita por ${actor.name}`,
          metadata: { batchId },
        },
        // A decisão foi revertida e este lote ainda não registrou o evento nesta comunicação
        // (condições determinísticas: não dependem do instante, que pode coincidir entre requisições).
        sql`exists (
          select 1 from ${decisions}
          where ${decisions.id} = ${decision.id} and ${decisions.revertedAt} is not null
        ) and not exists (
          select 1 from ${flowEvents}
          where ${flowEvents.communicationId} = ${decision.communicationId}
            and ${flowEvents.type} = 'DECISION_REVERTED'
            and json_extract(${flowEvents.metadata}, '$.batchId') = ${batchId}
        )`,
      ),
    ]);
    const results = await batchAll([approvalsRepository.closeBatch(batchId, now), ...statements]);
    if ((results[0] as { id: string }[]).length === 0) {
      throw new InvalidStateError('Este lote já foi desfeito.');
    }
    // O UPDATE guardado da comunicação é o segundo statement de cada trio após o fechamento do lote.
    const revertedCount = revertible.filter((_, i) => decisionApplied(results, 2, i)).length;
    return { revertedCount };
  },
};
