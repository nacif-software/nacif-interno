import {
  APP_TIMEZONE,
  MESSAGES,
  canCancel,
  canEditPeriod,
  canViewCommunication,
  countBusinessDays,
  formatCompactRange,
  formatDateRange,
  formatDayMonth,
  isApproverRole,
  isCommunicationCode,
  isoDateYear,
  todayIso,
  toZonedIsoDate,
  validateMinimumNotice,
  type CommunicationDetailDto,
  type CommunicationSummaryDto,
  type CommunicationsListQuery,
  type ConflictDto,
  type ConflictsQuery,
  type ConflictsResult,
  type CreateCommunicationBody,
  type Paginated,
  type UpdatePeriodBody,
} from '@nacif/shared';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { communications, type FlowEventMetadata } from '../../../db/schema';
import type { CommunicationRow } from '../../../db/types';
import type { AuthenticatedUser } from '../../../infra/http/context';
import { uniqueViolation } from '../../../infra/http/error-handler';
import {
  AppError,
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
  ValidationError,
} from '../../../infra/http/errors';
import { usersRepository } from '../../core/users/users.repository';
import { settingsRepository } from '../settings/settings.repository';
import { allocateCode } from './communication-code.service';
import { snapshotConflicts, toDetailDto, toSummaryDto } from './communication.mapper';
import { communicationsRepository } from './communications.repository';
import { findConflicts } from './conflict.service';
import { flowEventsRepository } from './flow-events.repository';

/** Tentativas de inserção quando duas requisições disputam a mesma sequência de código. */
const CODE_RACE_ATTEMPTS = 5;

function conflictMetadata(conflicts: ConflictDto[]): FlowEventMetadata {
  return {
    conflicts: conflicts.map((c) => ({ ...c })),
    conflictNotes: conflicts.map((c) =>
      MESSAGES.conflictFlagged(c.name, formatCompactRange(c.startDate, c.endDate)),
    ),
  };
}

async function loadOrThrow(idOrCode: string): Promise<CommunicationRow> {
  const row = isCommunicationCode(idOrCode)
    ? await communicationsRepository.findByCode(idOrCode.replace(/^#/, ''))
    : await communicationsRepository.findById(idOrCode);
  if (!row) throw new NotFoundError('Comunicação não encontrada.');
  return row;
}

async function assertPeople(actor: AuthenticatedUser, coverId: string, approverId: string) {
  if (coverId === actor.id)
    throw new ValidationError(MESSAGES.coverIsSelf, [
      { path: 'body.coverId', message: MESSAGES.coverIsSelf },
    ]);
  if (approverId === actor.id)
    throw new ValidationError(MESSAGES.approverIsSelf, [
      { path: 'body.approverId', message: MESSAGES.approverIsSelf },
    ]);
  const [cover, approver] = await Promise.all([
    usersRepository.findById(coverId),
    usersRepository.findById(approverId),
  ]);
  if (!cover || !cover.active)
    throw new ValidationError('Cobertura inválida.', [
      { path: 'body.coverId', message: 'Cobertura inválida.' },
    ]);
  if (!approver || !approver.active || !isApproverRole(approver.role)) {
    throw new ValidationError('Aprovador inválido.', [
      { path: 'body.approverId', message: 'Aprovador inválido.' },
    ]);
  }
}

async function assertNotice(startDate: string, now: Date) {
  const settings = await settingsRepository.get();
  const today = todayIso(APP_TIMEZONE, now);
  const result = validateMinimumNotice({ startDate, today, minNoticeDays: settings.minNoticeDays });
  if (!result.ok) {
    const message = MESSAGES.minimumNotice(settings.minNoticeDays);
    throw new ValidationError(message, [
      { path: 'body.startDate', message, earliestStart: result.earliestStart },
    ]);
  }
  return settings;
}

export const communicationsService = {
  async listMine(
    actor: AuthenticatedUser,
    query: CommunicationsListQuery,
  ): Promise<Paginated<CommunicationSummaryDto>> {
    const where = and(
      eq(communications.authorId, actor.id),
      query.status ? eq(communications.status, query.status) : undefined,
    );
    const [rows, total] = await Promise.all([
      communicationsRepository.findMany({
        where,
        orderBy: [desc(communications.submittedAt)],
        offset: (query.page - 1) * query.pageSize,
        limit: query.pageSize,
      }),
      communicationsRepository.count(where),
    ]);
    return { items: rows.map(toSummaryDto), total, page: query.page, pageSize: query.pageSize };
  },

  async conflicts(
    actor: AuthenticatedUser,
    query: ConflictsQuery,
    excludeCommunicationId?: string,
  ): Promise<ConflictsResult> {
    if (!actor.projectId) return { conflicts: [], limitReached: false, projectName: null };
    const settings = await settingsRepository.get();
    const result = await findConflicts({
      projectId: actor.projectId,
      range: query,
      excludeUserId: actor.id,
      excludeCommunicationId,
      maxSimultaneousPerProject: settings.maxSimultaneousPerProject,
    });
    return { ...result, projectName: actor.project?.name ?? null };
  },

  async create(
    actor: AuthenticatedUser,
    body: CreateCommunicationBody,
    now: Date = new Date(),
  ): Promise<CommunicationDetailDto> {
    if (!actor.projectId) {
      throw new AppError(
        422,
        'VALIDATION_ERROR',
        'Você precisa estar associado a um projeto. Procure um administrador.',
      );
    }
    const projectId = actor.projectId;
    await assertPeople(actor, body.coverId, body.approverId);
    const settings = await assertNotice(body.startDate, now);
    const businessDays = countBusinessDays(body.startDate, body.endDate);
    const { conflicts } = await findConflicts({
      projectId,
      range: body,
      excludeUserId: actor.id,
      maxSimultaneousPerProject: settings.maxSimultaneousPerProject,
    });
    const approver = await usersRepository.findById(body.approverId);
    const year = isoDateYear(toZonedIsoDate(now, APP_TIMEZONE));

    // Sem transação interativa no D1: o código vem de um upsert atômico e a inserção é um batch.
    // Se duas requisições disputarem a mesma sequência, o unique de `code` falha e tentamos de novo.
    const id = crypto.randomUUID();
    for (let attempt = 1; ; attempt++) {
      const { code, sequence } = await allocateCode(year);
      try {
        await db().batch([
          communicationsRepository.insert({
            id,
            code,
            year,
            sequence,
            authorId: actor.id,
            projectId,
            startDate: body.startDate,
            endDate: body.endDate,
            businessDays,
            coverId: body.coverId,
            approverId: body.approverId,
            notes: body.notes && body.notes.length > 0 ? body.notes : null,
            status: 'IN_REVIEW',
            submittedAt: now,
          }),
          flowEventsRepository.insert({
            communicationId: id,
            type: 'SUBMITTED',
            actorId: actor.id,
            occurredAt: now,
            description: actor.name,
          }),
          flowEventsRepository.insert({
            communicationId: id,
            type: 'IN_REVIEW',
            actorId: actor.id,
            occurredAt: now,
            description: `Encaminhada a ${approver?.name ?? ''}`.trim(),
            metadata: conflictMetadata(conflicts),
          }),
        ]);
        break;
      } catch (err) {
        const constraint = uniqueViolation(err);
        const codeRace = constraint?.startsWith('communications.') ?? false;
        if (!codeRace || attempt >= CODE_RACE_ATTEMPTS) throw err;
      }
    }
    return this.getDetail(actor, id);
  },

  async getDetail(actor: AuthenticatedUser, idOrCode: string): Promise<CommunicationDetailDto> {
    const row = await loadOrThrow(idOrCode);
    if (!canViewCommunication(actor, row)) throw new ForbiddenError();
    const settings = await settingsRepository.get();
    const live =
      row.status === 'IN_REVIEW'
        ? (
            await findConflicts({
              projectId: row.projectId,
              range: { startDate: row.startDate, endDate: row.endDate },
              excludeUserId: row.authorId,
              excludeCommunicationId: row.id,
              maxSimultaneousPerProject: settings.maxSimultaneousPerProject,
            })
          ).conflicts
        : snapshotConflicts(row);
    return toDetailDto(row, actor, live);
  },

  async updatePeriod(
    actor: AuthenticatedUser,
    idOrCode: string,
    body: UpdatePeriodBody,
    now: Date = new Date(),
  ): Promise<CommunicationDetailDto> {
    const row = await loadOrThrow(idOrCode);
    if (row.authorId !== actor.id) throw new ForbiddenError();
    if (!canEditPeriod(row.status))
      throw new InvalidStateError(
        'Só é possível editar o período enquanto a comunicação está em análise.',
      );
    const settings = await assertNotice(body.startDate, now);
    const businessDays = countBusinessDays(body.startDate, body.endDate);
    const { conflicts } = await findConflicts({
      projectId: row.projectId,
      range: body,
      excludeUserId: actor.id,
      excludeCommunicationId: row.id,
      maxSimultaneousPerProject: settings.maxSimultaneousPerProject,
    });
    const previous = toSummaryDto(row);

    const [updated] = await db().batch([
      communicationsRepository.update(
        row.id,
        { startDate: body.startDate, endDate: body.endDate, businessDays },
        'IN_REVIEW',
      ),
      flowEventsRepository.insert({
        communicationId: row.id,
        type: 'EDITED',
        actorId: actor.id,
        occurredAt: now,
        description: `Período alterado de ${formatDateRange(previous.startDate, previous.endDate)} para ${formatDateRange(body.startDate, body.endDate)}`,
        metadata: { previous: { startDate: previous.startDate, endDate: previous.endDate } },
      }),
      flowEventsRepository.insert({
        communicationId: row.id,
        type: 'IN_REVIEW',
        actorId: actor.id,
        occurredAt: now,
        description: `Reencaminhada a ${row.approver.name}`,
        metadata: conflictMetadata(conflicts),
      }),
    ]);
    if (updated.length === 0) {
      throw new InvalidStateError('Esta comunicação já foi decidida.');
    }
    return this.getDetail(actor, row.id);
  },

  async cancel(
    actor: AuthenticatedUser,
    idOrCode: string,
    now: Date = new Date(),
  ): Promise<CommunicationDetailDto> {
    const row = await loadOrThrow(idOrCode);
    if (row.authorId !== actor.id) throw new ForbiddenError();
    if (!canCancel(row.status))
      throw new InvalidStateError('Só é possível cancelar uma comunicação em análise.');
    const [updated] = await db().batch([
      communicationsRepository.update(
        row.id,
        { status: 'CANCELLED', cancelledAt: now },
        'IN_REVIEW',
      ),
      flowEventsRepository.insert({
        communicationId: row.id,
        type: 'CANCELLED',
        actorId: actor.id,
        occurredAt: now,
        description: `Cancelada pelo autor em ${formatDayMonth(toZonedIsoDate(now, APP_TIMEZONE))}.`,
      }),
    ]);
    if (updated.length === 0) {
      throw new InvalidStateError('Só é possível cancelar uma comunicação em análise.');
    }
    return this.getDetail(actor, row.id);
  },
};
