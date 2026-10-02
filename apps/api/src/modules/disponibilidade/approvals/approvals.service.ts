import {
  BATCH_UNDO_WINDOW_MS,
  canDecideOn,
  monthEnd,
  monthStart,
  parseIsoDate,
  type ApprovalsQuery,
  type ApprovalsResult,
  type BatchApproveResult,
  type BatchUndoResult,
  type CommunicationDetailDto,
} from '@nacif/shared';
import type { Prisma } from '../../../generated/prisma/client';
import {
  AppError,
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
} from '../../../infra/http/errors';
import type { AuthenticatedUser } from '../../../infra/http/require-auth';
import { db, type Tx } from '../../../infra/prisma/client';
import { toQueueItemDto } from '../communications/communication.mapper';
import {
  communicationsRepository,
  type CommunicationRow,
} from '../communications/communications.repository';
import { communicationsService } from '../communications/communications.service';
import { flowEventsRepository } from '../communications/flow-events.repository';

function scopeFor(actor: AuthenticatedUser): Prisma.CommunicationWhereInput {
  return actor.role === 'ADMIN' ? {} : { approverId: actor.id };
}

async function loadDecidable(
  actor: AuthenticatedUser,
  id: string,
  tx: Tx,
): Promise<CommunicationRow> {
  const row = await communicationsRepository.findById(id, tx);
  if (!row) throw new NotFoundError('Comunicação não encontrada.');
  if (!canDecideOn(actor, row)) throw new ForbiddenError();
  if (row.status !== 'IN_REVIEW') throw new InvalidStateError('Esta comunicação já foi decidida.');
  return row;
}

async function decide(
  tx: Tx,
  actor: AuthenticatedUser,
  row: CommunicationRow,
  type: 'APPROVED' | 'REJECTED',
  now: Date,
  options: { justification?: string; batchId?: string } = {},
) {
  await tx.decision.create({
    data: {
      communicationId: row.id,
      type,
      deciderId: actor.id,
      decidedAt: now,
      justification: options.justification ?? null,
      batchId: options.batchId ?? null,
    },
  });
  await communicationsRepository.update(row.id, { status: type }, tx);
  await flowEventsRepository.create(
    {
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
    },
    tx,
  );
}

export const approvalsService = {
  async queue(actor: AuthenticatedUser, query: ApprovalsQuery): Promise<ApprovalsResult> {
    const scope = scopeFor(actor);
    const period: Prisma.CommunicationWhereInput = {};
    if (query.from) period.endDate = { gte: parseIsoDate(monthStart(query.from)) };
    if (query.to) period.startDate = { lte: parseIsoDate(monthEnd(query.to)) };
    const project: Prisma.CommunicationWhereInput = query.projectId
      ? { projectId: query.projectId }
      : {};
    const base: Prisma.CommunicationWhereInput = { ...scope, ...period, ...project };
    const where: Prisma.CommunicationWhereInput = { ...base, status: query.status };

    const [rows, total, inReview, approved, rejected] = await Promise.all([
      communicationsRepository.findMany({
        where,
        orderBy: [{ submittedAt: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      communicationsRepository.count(where),
      communicationsRepository.count({ ...base, status: 'IN_REVIEW' }),
      communicationsRepository.count({ ...base, status: 'APPROVED' }),
      communicationsRepository.count({ ...base, status: 'REJECTED' }),
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
    await db.$transaction(async (tx) => {
      const row = await loadDecidable(actor, id, tx);
      await decide(tx, actor, row, 'APPROVED', now);
    });
    return communicationsService.getDetail(actor, id);
  },

  async reject(
    actor: AuthenticatedUser,
    id: string,
    justification: string,
    now: Date = new Date(),
  ): Promise<CommunicationDetailDto> {
    await db.$transaction(async (tx) => {
      const row = await loadDecidable(actor, id, tx);
      await decide(tx, actor, row, 'REJECTED', now, { justification });
    });
    return communicationsService.getDetail(actor, id);
  },

  async batchApprove(
    actor: AuthenticatedUser,
    ids: string[],
    now: Date = new Date(),
  ): Promise<BatchApproveResult> {
    const undoableUntil = new Date(now.getTime() + BATCH_UNDO_WINDOW_MS);
    return db.$transaction(async (tx) => {
      const batch = await tx.approvalBatch.create({
        data: { approverId: actor.id, undoableUntil },
      });
      const skipped: string[] = [];
      let approvedCount = 0;
      for (const id of [...new Set(ids)]) {
        const row = await communicationsRepository.findById(id, tx);
        if (!row || !canDecideOn(actor, row) || row.status !== 'IN_REVIEW') {
          skipped.push(id);
          continue;
        }
        await decide(tx, actor, row, 'APPROVED', now, { batchId: batch.id });
        approvedCount += 1;
      }
      return {
        batchId: batch.id,
        approvedCount,
        skipped,
        undoableUntil: undoableUntil.toISOString(),
      };
    });
  },

  async undoBatch(
    actor: AuthenticatedUser,
    batchId: string,
    now: Date = new Date(),
  ): Promise<BatchUndoResult> {
    return db.$transaction(async (tx) => {
      const batch = await tx.approvalBatch.findUnique({
        where: { id: batchId },
        include: { decisions: { where: { revertedAt: null }, include: { communication: true } } },
      });
      if (!batch) throw new NotFoundError('Lote não encontrado.');
      if (batch.approverId !== actor.id) throw new ForbiddenError();
      if (batch.undoneAt) throw new InvalidStateError('Este lote já foi desfeito.');
      if (batch.undoableUntil.getTime() < now.getTime()) {
        throw new AppError(409, 'UNDO_WINDOW_EXPIRED', 'O prazo para desfazer este lote terminou.');
      }
      let revertedCount = 0;
      for (const decision of batch.decisions) {
        if (decision.communication.status !== 'APPROVED') continue;
        await tx.decision.update({ where: { id: decision.id }, data: { revertedAt: now } });
        await communicationsRepository.update(
          decision.communicationId,
          { status: 'IN_REVIEW' },
          tx,
        );
        await flowEventsRepository.create(
          {
            communicationId: decision.communicationId,
            type: 'DECISION_REVERTED',
            actorId: actor.id,
            occurredAt: now,
            description: `Aprovação em lote desfeita por ${actor.name}`,
            metadata: { batchId },
          },
          tx,
        );
        revertedCount += 1;
      }
      await tx.approvalBatch.update({ where: { id: batchId }, data: { undoneAt: now } });
      return { revertedCount };
    });
  },
};
