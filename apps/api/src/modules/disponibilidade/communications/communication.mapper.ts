import {
  canCancel,
  canDecideOn,
  canEditPeriod,
  toIsoDate,
  type CommunicationDetailDto,
  type CommunicationSummaryDto,
  type ConflictDto,
  type FlowEventDto,
  type QueueItemDto,
} from '@nacif/shared';
import type { AuthenticatedUser } from '../../../infra/http/require-auth';
import type { CommunicationRow } from './communications.repository';

export function toSummaryDto(row: CommunicationRow): CommunicationSummaryDto {
  const decision = row.decisions[0] ?? null;
  return {
    id: row.id,
    code: row.code,
    startDate: toIsoDate(row.startDate),
    endDate: toIsoDate(row.endDate),
    businessDays: row.businessDays,
    status: row.status,
    submittedAt: row.submittedAt.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    author: { id: row.author.id, name: row.author.name },
    cover: { id: row.cover.id, name: row.cover.name },
    approver: { id: row.approver.id, name: row.approver.name },
    project: { id: row.project.id, name: row.project.name },
    decision: decision
      ? {
          type: decision.type,
          decider: deciderRef(row, decision.deciderId),
          decidedAt: decision.decidedAt.toISOString(),
          justification: decision.justification,
        }
      : null,
  };
}

function deciderRef(row: CommunicationRow, deciderId: string) {
  const fromEvents = row.events.find(
    (e) => e.type === 'DECISION' && e.actorId === deciderId,
  )?.actor;
  if (fromEvents) return { id: fromEvents.id, name: fromEvents.name };
  if (row.approver.id === deciderId) return { id: row.approver.id, name: row.approver.name };
  return { id: deciderId, name: 'Administrador' };
}

export function toFlowEventDto(e: CommunicationRow['events'][number]): FlowEventDto {
  return {
    id: e.id,
    type: e.type,
    actor: e.actor ? { id: e.actor.id, name: e.actor.name } : null,
    occurredAt: e.occurredAt.toISOString(),
    description: e.description,
    metadata: (e.metadata as Record<string, unknown> | null) ?? null,
  };
}

/** Conflitos registrados no último evento IN_REVIEW (snapshot do envio/edição). */
export function snapshotConflicts(row: CommunicationRow): ConflictDto[] {
  const last = [...row.events].reverse().find((e) => e.type === 'IN_REVIEW');
  const meta = last?.metadata as { conflicts?: ConflictDto[] } | null | undefined;
  return meta?.conflicts ?? [];
}

export function toQueueItemDto(row: CommunicationRow): QueueItemDto {
  return { ...toSummaryDto(row), hasConflicts: snapshotConflicts(row).length > 0 };
}

export function toDetailDto(
  row: CommunicationRow,
  actor: AuthenticatedUser,
  liveConflicts: ConflictDto[],
): CommunicationDetailDto {
  const isAuthor = actor.id === row.authorId;
  return {
    ...toSummaryDto(row),
    notes: row.notes,
    flow: row.events.map(toFlowEventDto),
    conflicts: liveConflicts,
    permissions: {
      canCancel: isAuthor && canCancel(row.status),
      canEditPeriod: isAuthor && canEditPeriod(row.status),
      canDecide: row.status === 'IN_REVIEW' && canDecideOn(actor, row),
    },
  };
}
