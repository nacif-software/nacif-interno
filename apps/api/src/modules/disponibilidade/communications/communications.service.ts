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
  parseIsoDate,
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
import type { Prisma } from '../../../generated/prisma/client';
import {
  AppError,
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
  ValidationError,
} from '../../../infra/http/errors';
import type { AuthenticatedUser } from '../../../infra/http/require-auth';
import { db, type DbOrTx } from '../../../infra/prisma/client';
import { usersRepository } from '../../core/users/users.repository';
import { settingsRepository } from '../settings/settings.repository';
import { allocateCode } from './communication-code.service';
import { snapshotConflicts, toDetailDto, toSummaryDto } from './communication.mapper';
import { communicationsRepository, type CommunicationRow } from './communications.repository';
import { findConflicts } from './conflict.service';
import { flowEventsRepository } from './flow-events.repository';

function conflictMetadata(conflicts: ConflictDto[]): Prisma.InputJsonValue {
  return {
    conflicts: conflicts.map((c) => ({ ...c })),
    conflictNotes: conflicts.map((c) =>
      MESSAGES.conflictFlagged(c.name, formatCompactRange(c.startDate, c.endDate)),
    ),
  };
}

async function loadOrThrow(idOrCode: string, tx: DbOrTx = db): Promise<CommunicationRow> {
  const row = isCommunicationCode(idOrCode)
    ? await communicationsRepository.findByCode(idOrCode.replace(/^#/, ''), tx)
    : await communicationsRepository.findById(idOrCode, tx);
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
    const where: Prisma.CommunicationWhereInput = {
      authorId: actor.id,
      ...(query.status ? { status: query.status } : {}),
    };
    const [rows, total] = await Promise.all([
      communicationsRepository.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
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

    const created = await db.$transaction(async (tx) => {
      const year = isoDateYear(toZonedIsoDate(now, APP_TIMEZONE));
      const { code, sequence } = await allocateCode(tx, year);
      const row = await communicationsRepository.create(
        {
          code,
          year,
          sequence,
          authorId: actor.id,
          projectId,
          startDate: parseIsoDate(body.startDate),
          endDate: parseIsoDate(body.endDate),
          businessDays,
          coverId: body.coverId,
          approverId: body.approverId,
          notes: body.notes && body.notes.length > 0 ? body.notes : null,
          status: 'IN_REVIEW',
          submittedAt: now,
        },
        tx,
      );
      await flowEventsRepository.create(
        {
          communicationId: row.id,
          type: 'SUBMITTED',
          actorId: actor.id,
          occurredAt: now,
          description: actor.name,
        },
        tx,
      );
      await flowEventsRepository.create(
        {
          communicationId: row.id,
          type: 'IN_REVIEW',
          actorId: actor.id,
          occurredAt: now,
          description: `Encaminhada a ${approver?.name ?? ''}`.trim(),
          metadata: conflictMetadata(conflicts),
        },
        tx,
      );
      return row.id;
    });
    return this.getDetail(actor, created);
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
              range: { startDate: toSummaryDto(row).startDate, endDate: toSummaryDto(row).endDate },
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

    await db.$transaction(async (tx) => {
      await communicationsRepository.update(
        row.id,
        {
          startDate: parseIsoDate(body.startDate),
          endDate: parseIsoDate(body.endDate),
          businessDays,
        },
        tx,
      );
      await flowEventsRepository.create(
        {
          communicationId: row.id,
          type: 'EDITED',
          actorId: actor.id,
          occurredAt: now,
          description: `Período alterado de ${formatDateRange(previous.startDate, previous.endDate)} para ${formatDateRange(body.startDate, body.endDate)}`,
          metadata: { previous: { startDate: previous.startDate, endDate: previous.endDate } },
        },
        tx,
      );
      await flowEventsRepository.create(
        {
          communicationId: row.id,
          type: 'IN_REVIEW',
          actorId: actor.id,
          occurredAt: now,
          description: `Reencaminhada a ${row.approver.name}`,
          metadata: conflictMetadata(conflicts),
        },
        tx,
      );
    });
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
    await db.$transaction(async (tx) => {
      await communicationsRepository.update(row.id, { status: 'CANCELLED', cancelledAt: now }, tx);
      await flowEventsRepository.create(
        {
          communicationId: row.id,
          type: 'CANCELLED',
          actorId: actor.id,
          occurredAt: now,
          description: `Cancelada pelo autor em ${formatDayMonth(toZonedIsoDate(now, APP_TIMEZONE))}.`,
        },
        tx,
      );
    });
    return this.getDetail(actor, row.id);
  },
};
