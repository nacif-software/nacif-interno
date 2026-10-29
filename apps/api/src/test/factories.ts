import { countBusinessDays, type CommunicationStatus, type Role } from '@nacif/shared';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import {
  availabilityDefaultApprovers,
  availabilitySettings,
  communications,
  flowEvents,
  projects,
  users,
} from '../db/schema';
import type { Communication, Project, UserWithProject } from '../db/types';
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
    projectId?: string | null;
    withPassword?: boolean;
  } = {},
): Promise<UserWithProject> {
  const slug = Math.random().toString(36).slice(2, 8);
  const id = crypto.randomUUID();
  await db()
    .insert(users)
    .values({
      id,
      name: overrides.name ?? `Pessoa ${slug}`,
      email: overrides.email ?? `${slug}@nacif.xyz`,
      role: overrides.role ?? 'MEMBER',
      active: overrides.active ?? true,
      projectId: overrides.projectId ?? null,
      passwordHash: overrides.withPassword === false ? null : await passwordHash(),
    });
  const row = await db().query.users.findFirst({
    where: eq(users.id, id),
    with: { project: true },
  });
  if (!row) throw new Error('Usuário não criado');
  return row;
}

export async function createSettings(
  overrides: { minNoticeDays?: number; maxSimultaneousPerProject?: number } = {},
) {
  const values = {
    minNoticeDays: overrides.minNoticeDays ?? 7,
    maxSimultaneousPerProject: overrides.maxSimultaneousPerProject ?? 2,
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
export async function createCommunication(input: {
  authorId: string;
  projectId: string;
  coverId: string;
  approverId: string;
  startDate: string;
  endDate: string;
  status?: CommunicationStatus;
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
        projectId: input.projectId,
        startDate: input.startDate,
        endDate: input.endDate,
        businessDays: countBusinessDays(input.startDate, input.endDate),
        coverId: input.coverId,
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
