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
import { and, asc, eq, gte, isNull, lte, type SQL } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { db } from '../../../db/client';
import { approvalBatches, communications, decisions } from '../../../db/schema';
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
 * Statements de uma decisão, para um `batch()`. O primeiro é o UPDATE com guard de status
 * (`returning`), que devolve vazio se outra requisição decidiu antes.
 */
function decideStatements(
  actor: AuthenticatedUser,
  row: CommunicationRow,
  type: 'APPROVED' | 'REJECTED',
  now: Date,
  options: { justification?: string; batchId?: string } = {},
): [ReturnType<typeof communicationsRepository.update>, ...BatchItem<'sqlite'>[]] {
  return [
    communicationsRepository.update(row.id, { status: type }, 'IN_REVIEW'),
    db()
      .insert(decisions)
      .values({
        communicationId: row.id,
        type,
        deciderId: actor.id,
        decidedAt: now,
        justification: options.justification ?? null,
        batchId: options.batchId ?? null,
      }),
    flowEventsRepository.insert({
      communicationId: row.id,
      type: 'DECISION',
      actorId: actor.id,
      occurredAt: now,
      description:
        type === 'APPROVED' ? `Aprovada por ${actor.name}` : `Recusada por ${actor.name}`,
      metadata: {
        decision: type,
        justification: options.justification ?? null,
        batchId: options.batchId ?? null,
      },
    }),
  ];
}

async function decide(
  actor: AuthenticatedUser,
  row: CommunicationRow,
  type: 'APPROVED' | 'REJECTED',
  now: Date,
  options: { justification?: string } = {},
) {
  const [updated] = await db().batch(decideStatements(actor, row, type, now, options));
  if (updated.length === 0) throw new InvalidStateError('Esta comunicação já foi decidida.');
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
    const statements: BatchItem<'sqlite'>[] = [
      db().insert(approvalBatches).values({ id: batchId, approverId: actor.id, undoableUntil }),
      ...eligible.flatMap((row) => decideStatements(actor, row, 'APPROVED', now, { batchId })),
    ];
    const [first, ...rest] = statements;
    if (!first) throw new Error('Batch vazio');
    const results = await db().batch([first, ...rest]);
    // Cada decisão ocupa 3 statements a partir do índice 1; o primeiro é o UPDATE com guard.
    let approvedCount = 0;
    eligible.forEach((_, i) => {
      const updated = results[1 + i * 3] as { id: string }[];
      if (updated.length > 0) approvedCount += 1;
    });
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
    const batch = await db().query.approvalBatches.findFirst({
      where: eq(approvalBatches.id, batchId),
      with: { decisions: { where: isNull(decisions.revertedAt), with: { communication: true } } },
    });
    if (!batch) throw new NotFoundError('Lote não encontrado.');
    if (batch.approverId !== actor.id) throw new ForbiddenError();
    if (batch.undoneAt) throw new InvalidStateError('Este lote já foi desfeito.');
    if (batch.undoableUntil.getTime() < now.getTime()) {
      throw new AppError(409, 'UNDO_WINDOW_EXPIRED', 'O prazo para desfazer este lote terminou.');
    }
    const revertible = batch.decisions.filter((d) => d.communication.status === 'APPROVED');
    const statements: BatchItem<'sqlite'>[] = revertible.flatMap((decision) => [
      db().update(decisions).set({ revertedAt: now }).where(eq(decisions.id, decision.id)),
      communicationsRepository.update(
        decision.communicationId,
        { status: 'IN_REVIEW' },
        'APPROVED',
      ),
      flowEventsRepository.insert({
        communicationId: decision.communicationId,
        type: 'DECISION_REVERTED',
        actorId: actor.id,
        occurredAt: now,
        description: `Aprovação em lote desfeita por ${actor.name}`,
        metadata: { batchId },
      }),
    ]);
    const closeBatch = db()
      .update(approvalBatches)
      .set({ undoneAt: now })
      .where(and(eq(approvalBatches.id, batchId), isNull(approvalBatches.undoneAt)))
      .returning({ id: approvalBatches.id });
    const results = await db().batch([closeBatch, ...statements]);
    if ((results[0] as { id: string }[]).length === 0) {
      throw new InvalidStateError('Este lote já foi desfeito.');
    }
    return { revertedCount: revertible.length };
  },
};
