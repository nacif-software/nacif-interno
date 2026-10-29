import { COMMUNICATION_STATUSES, DECISION_TYPES, FLOW_EVENT_TYPES, ROLES } from '@nacif/shared';
import { sql } from 'drizzle-orm';
import {
  check,
  customType,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';

/**
 * Schema do D1 (SQLite). Convenções (ADR 0011):
 * - ids UUID gerados no código; instantes em texto ISO-8601 UTC (`Date` no código);
 * - datas de calendário em texto `YYYY-MM-DD`; enums em texto com CHECK; JSON em texto.
 */

/** `Date` no código, ISO-8601 UTC no banco (ordenável e legível no console do D1). */
export const isoTimestamp = customType<{ data: Date; driverData: string }>({
  dataType: () => 'text',
  toDriver: (value) => value.toISOString(),
  fromDriver: (value) => new Date(value),
});

const uuid = () => crypto.randomUUID();
const now = () => new Date();
const inList = (values: readonly string[]) => values.map((v) => `'${v}'`).join(', ');

const id = (name = 'id') => text(name).primaryKey().$defaultFn(uuid);
const createdAt = () => isoTimestamp('created_at').notNull().$defaultFn(now);
const updatedAt = () =>
  isoTimestamp('updated_at')
    .notNull()
    .$defaultFn(now)
    .$onUpdate(() => new Date());

// ---------------------------------------------------------------- core

export const users = sqliteTable(
  'users',
  {
    id: id(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    role: text('role', { enum: ROLES }).notNull().default('MEMBER'),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    passwordHash: text('password_hash'),
    invitedAt: isoTimestamp('invited_at'),
    projectId: text('project_id').references((): AnySQLiteColumn => projects.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('users_email_key').on(t.email),
    index('users_project_id_idx').on(t.projectId),
    index('users_active_role_idx').on(t.active, t.role),
    check('users_role_check', sql.raw(`role in (${inList(ROLES)})`)),
  ],
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    lastSeenAt: isoTimestamp('last_seen_at').notNull().$defaultFn(now),
    expiresAt: isoTimestamp('expires_at').notNull(),
  },
  (t) => [
    index('sessions_user_id_idx').on(t.userId),
    index('sessions_expires_at_idx').on(t.expiresAt),
  ],
);

export const passwordSetupTokens = sqliteTable(
  'password_setup_tokens',
  {
    id: id(),
    tokenHash: text('token_hash').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: isoTimestamp('expires_at').notNull(),
    usedAt: isoTimestamp('used_at'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('password_setup_tokens_token_hash_key').on(t.tokenHash),
    index('password_setup_tokens_user_id_idx').on(t.userId),
  ],
);

export const projects = sqliteTable(
  'projects',
  {
    id: id(),
    name: text('name').notNull(),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    defaultApproverId: text('default_approver_id').references((): AnySQLiteColumn => users.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('projects_name_key').on(t.name)],
);

// ------------------------------------------------------ disponibilidade

export const availabilitySettings = sqliteTable('availability_settings', {
  id: integer('id').primaryKey().default(1),
  minNoticeDays: integer('min_notice_days').notNull().default(7),
  maxSimultaneousPerProject: integer('max_simultaneous_per_project').notNull().default(2),
  updatedAt: updatedAt(),
});

export const availabilityDefaultApprovers = sqliteTable(
  'availability_default_approvers',
  {
    settingsId: integer('settings_id')
      .notNull()
      .default(1)
      .references(() => availabilitySettings.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.settingsId, t.userId] }),
    uniqueIndex('availability_default_approvers_user_id_key').on(t.userId),
  ],
);

export const communicationCounters = sqliteTable('communication_counters', {
  year: integer('year').primaryKey(),
  lastSequence: integer('last_sequence').notNull().default(0),
});

export const communications = sqliteTable(
  'communications',
  {
    id: id(),
    code: text('code').notNull(),
    year: integer('year').notNull(),
    sequence: integer('sequence').notNull(),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    /** `YYYY-MM-DD` */
    startDate: text('start_date').notNull(),
    /** `YYYY-MM-DD` */
    endDate: text('end_date').notNull(),
    businessDays: integer('business_days').notNull(),
    coverId: text('cover_id')
      .notNull()
      .references(() => users.id),
    approverId: text('approver_id')
      .notNull()
      .references(() => users.id),
    notes: text('notes'),
    status: text('status', { enum: COMMUNICATION_STATUSES }).notNull().default('IN_REVIEW'),
    submittedAt: isoTimestamp('submitted_at').notNull(),
    cancelledAt: isoTimestamp('cancelled_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('communications_code_key').on(t.code),
    uniqueIndex('communications_year_sequence_key').on(t.year, t.sequence),
    index('communications_author_id_submitted_at_idx').on(t.authorId, t.submittedAt),
    index('communications_approver_id_status_submitted_at_idx').on(
      t.approverId,
      t.status,
      t.submittedAt,
    ),
    index('communications_project_id_status_start_date_end_date_idx').on(
      t.projectId,
      t.status,
      t.startDate,
      t.endDate,
    ),
    index('communications_status_start_date_end_date_idx').on(t.status, t.startDate, t.endDate),
    check('communications_status_check', sql.raw(`status in (${inList(COMMUNICATION_STATUSES)})`)),
  ],
);

export const approvalBatches = sqliteTable('approval_batches', {
  id: id(),
  approverId: text('approver_id')
    .notNull()
    .references(() => users.id),
  createdAt: createdAt(),
  undoableUntil: isoTimestamp('undoable_until').notNull(),
  undoneAt: isoTimestamp('undone_at'),
});

export const decisions = sqliteTable(
  'decisions',
  {
    id: id(),
    communicationId: text('communication_id')
      .notNull()
      .references(() => communications.id, { onDelete: 'cascade' }),
    type: text('type', { enum: DECISION_TYPES }).notNull(),
    deciderId: text('decider_id')
      .notNull()
      .references(() => users.id),
    decidedAt: isoTimestamp('decided_at').notNull().$defaultFn(now),
    justification: text('justification'),
    batchId: text('batch_id').references(() => approvalBatches.id),
    revertedAt: isoTimestamp('reverted_at'),
  },
  (t) => [
    index('decisions_communication_id_decided_at_idx').on(t.communicationId, t.decidedAt),
    index('decisions_batch_id_idx').on(t.batchId),
    check('decisions_type_check', sql.raw(`type in (${inList(DECISION_TYPES)})`)),
  ],
);

/** Formas do `metadata` por tipo de evento (ver `communications.service.ts` e `approvals.service.ts`). */
export type FlowEventMetadata =
  | {
      conflicts: {
        userId: string;
        name: string;
        startDate: string;
        endDate: string;
        status: string;
      }[];
      conflictNotes: string[];
    }
  | { previous: { startDate: string; endDate: string } }
  | { decision: 'APPROVED' | 'REJECTED'; justification: string | null; batchId: string | null }
  | { batchId: string };

export const flowEvents = sqliteTable(
  'flow_events',
  {
    id: id(),
    communicationId: text('communication_id')
      .notNull()
      .references(() => communications.id, { onDelete: 'cascade' }),
    type: text('type', { enum: FLOW_EVENT_TYPES }).notNull(),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    occurredAt: isoTimestamp('occurred_at').notNull().$defaultFn(now),
    description: text('description').notNull(),
    metadata: text('metadata', { mode: 'json' }).$type<FlowEventMetadata>(),
  },
  (t) => [
    index('flow_events_communication_id_occurred_at_idx').on(t.communicationId, t.occurredAt),
    check('flow_events_type_check', sql.raw(`type in (${inList(FLOW_EVENT_TYPES)})`)),
  ],
);
