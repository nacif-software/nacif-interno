import { countBusinessDays, type CommunicationStatus, type Role } from '@nacif/shared';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import {
  availabilityDefaultApprovers,
  availabilityLedgerEntries,
  availabilitySettings,
  communications,
  flowEvents,
  projects,
  userProjects,
  users,
} from '../db/schema';
import type { Communication, LedgerEntry, Project, UserWithProjects } from '../db/types';
import { hashPassword } from '../modules/core/auth/password';

export const TEST_PASSWORD = 'senha-forte-123';
let cachedHash: string | null = null;
async function passwordHash() {
  cachedHash ??= await hashPassword(TEST_PASSWORD);
  return cachedHash;
}

export async function createProject(
  overrides: { name?: string; defaultApproverId?: string | null } = {},
): Promise<Project> {
  const [row] = await db()
    .insert(projects)
    .values({
      name: overrides.name ?? `Projeto ${Math.random().toString(36).slice(2, 8)}`,
      defaultApproverId: overrides.defaultApproverId ?? null,
    })
    .returning();
  if (!row) throw new Error('Projeto não criado');
  return row;
}

export async function createUser(
  overrides: {
    name?: string;
    email?: string;
    role?: Role;
    active?: boolean;
    /** Projetos da pessoa (N:N). `projectId` é atalho para um só. */
    projectIds?: string[];
    projectId?: string | null;
    creditBaseDate?: string | null;
    withPassword?: boolean;
  } = {},
): Promise<UserWithProjects> {
  const slug = Math.random().toString(36).slice(2, 8);
  const id = crypto.randomUUID();
  const projectIds = overrides.projectIds ?? (overrides.projectId ? [overrides.projectId] : []);
  await db()
    .insert(users)
    .values({
      id,
      name: overrides.name ?? `Pessoa ${slug}`,
      email: overrides.email ?? `${slug}@nacif.xyz`,
      role: overrides.role ?? 'MEMBER',
      active: overrides.active ?? true,
      creditBaseDate: overrides.creditBaseDate ?? null,
      passwordHash: overrides.withPassword === false ? null : await passwordHash(),
    });
  if (projectIds.length > 0) {
    await db()
      .insert(userProjects)
      .values(projectIds.map((projectId) => ({ userId: id, projectId })));
  }
  const row = await db().query.users.findFirst({
    where: eq(users.id, id),
    with: { projects: { with: { project: true } } },
  });
  if (!row) throw new Error('Usuário não criado');
  return row;
}

export async function createSettings(
  overrides: {
    minNoticeDays?: number;
    maxSimultaneousPerProject?: number;
    daysPerYear?: number;
  } = {},
) {
  const values = {
    minNoticeDays: overrides.minNoticeDays ?? 7,
    maxSimultaneousPerProject: overrides.maxSimultaneousPerProject ?? 2,
    daysPerYear: overrides.daysPerYear ?? 10,
  };
  const [row] = await db()
    .insert(availabilitySettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: availabilitySettings.id, set: values })
    .returning();
  return row;
}

/** Sequências a partir de 9000 para não colidir com as alocadas pelo service (que começam em 1). */
let seq = 9000;
/** Lançamento no saldo de dias (crédito anual, crédito manual ou venda). */
export async function createLedgerEntry(input: {
  userId: string;
  type: 'ACCRUAL' | 'GRANT' | 'SALE';
  days: number;
  referenceDate: string;
  referenceYear?: number | null;
  note?: string | null;
  createdById?: string | null;
}): Promise<LedgerEntry> {
  const [row] = await db()
    .insert(availabilityLedgerEntries)
    .values({
      userId: input.userId,
      type: input.type,
      days: input.days,
      referenceDate: input.referenceDate,
      referenceYear: input.referenceYear ?? null,
      note: input.note ?? (input.type === 'ACCRUAL' ? null : 'lançamento de teste'),
      createdById: input.createdById ?? null,
    })
    .returning();
  if (!row) throw new Error('Lançamento não criado');
  return row;
}

export async function createCommunication(input: {
  authorId: string;
  projectId?: string | null;
  coverId?: string | null;
  approverId: string;
  startDate: string;
  endDate: string;
  status?: CommunicationStatus;
  deductedDays?: number | null;
  submittedAt?: Date;
  notes?: string;
}): Promise<Communication> {
  seq += 1;
  const year = Number(input.startDate.slice(0, 4));
  const id = crypto.randomUUID();
  const now = new Date();
  const [row] = await db().batch([
    db()
      .insert(communications)
      .values({
        id,
        code: `${year}-${String(seq).padStart(4, '0')}`,
        year,
        sequence: seq,
        authorId: input.authorId,
        projectId: input.projectId ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        businessDays: countBusinessDays(input.startDate, input.endDate),
        deductedDays:
          input.deductedDays !== undefined
            ? input.deductedDays
            : input.status === 'APPROVED'
              ? countBusinessDays(input.startDate, input.endDate)
              : null,
        coverId: input.coverId ?? null,
        approverId: input.approverId,
        notes: input.notes ?? null,
        status: input.status ?? 'IN_REVIEW',
        submittedAt: input.submittedAt ?? now,
      })
      .returning(),
    db()
      .insert(flowEvents)
      .values([
        {
          communicationId: id,
          type: 'SUBMITTED',
          actorId: input.authorId,
          occurredAt: now,
          description: 'autor',
        },
        {
          communicationId: id,
          type: 'IN_REVIEW',
          actorId: input.authorId,
          occurredAt: now,
          description: 'encaminhada',
          metadata: { conflicts: [], conflictNotes: [] },
        },
      ]),
  ]);
  const created = row[0];
  if (!created) throw new Error('Comunicação não criada');
  return created;
}

/** Cenário padrão: projeto Órion com admin Caio, aprovador Marina e membros Pedro e Júlia. */
export async function seedTeam() {
  const orion = await createProject({ name: 'Órion' });
  const atlas = await createProject({ name: 'Atlas' });
  const caio = await createUser({
    name: 'Caio Bertelli',
    email: 'caio@nacif.xyz',
    role: 'ADMIN',
    projectId: orion.id,
  });
  const marina = await createUser({
    name: 'Marina Duarte',
    email: 'marina@nacif.xyz',
    role: 'APPROVER',
    projectId: orion.id,
  });
  const pedro = await createUser({
    name: 'Pedro Nakano',
    email: 'pedro@nacif.xyz',
    projectId: orion.id,
  });
  const julia = await createUser({
    name: 'Júlia Reis',
    email: 'julia@nacif.xyz',
    projectId: atlas.id,
  });
  const thiago = await createUser({
    name: 'Thiago Lemos',
    email: 'thiago@nacif.xyz',
    active: false,
    projectId: atlas.id,
  });
  await db().update(projects).set({ defaultApproverId: caio.id }).where(eq(projects.id, orion.id));
  await createSettings();
  await db()
    .insert(availabilityDefaultApprovers)
    .values({ settingsId: 1, userId: caio.id, position: 0 });
  return { orion, atlas, caio, marina, pedro, julia, thiago };
}
