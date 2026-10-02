import {
  countBusinessDays,
  parseIsoDate,
  type CommunicationStatus,
  type Role,
} from '@nacif/shared';
import { db } from '../infra/prisma/client';
import { hashPassword } from '../modules/core/auth/password';

export const TEST_PASSWORD = 'senha-forte-123';
let cachedHash: string | null = null;
async function passwordHash() {
  cachedHash ??= await hashPassword(TEST_PASSWORD);
  return cachedHash;
}

export async function createProject(
  overrides: { name?: string; defaultApproverId?: string | null } = {},
) {
  return db.project.create({
    data: {
      name: overrides.name ?? `Projeto ${Math.random().toString(36).slice(2, 8)}`,
      defaultApproverId: overrides.defaultApproverId ?? null,
    },
  });
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
) {
  const slug = Math.random().toString(36).slice(2, 8);
  return db.user.create({
    data: {
      name: overrides.name ?? `Pessoa ${slug}`,
      email: overrides.email ?? `${slug}@nacif.xyz`,
      role: overrides.role ?? 'MEMBER',
      active: overrides.active ?? true,
      projectId: overrides.projectId ?? null,
      passwordHash: overrides.withPassword === false ? null : await passwordHash(),
    },
    include: { project: true },
  });
}

export async function createSettings(
  overrides: { minNoticeDays?: number; maxSimultaneousPerProject?: number } = {},
) {
  return db.availabilitySettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      minNoticeDays: overrides.minNoticeDays ?? 7,
      maxSimultaneousPerProject: overrides.maxSimultaneousPerProject ?? 2,
    },
    update: {
      minNoticeDays: overrides.minNoticeDays ?? 7,
      maxSimultaneousPerProject: overrides.maxSimultaneousPerProject ?? 2,
    },
  });
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
}) {
  seq += 1;
  const year = Number(input.startDate.slice(0, 4));
  return db.communication.create({
    data: {
      code: `${year}-${String(seq).padStart(4, '0')}`,
      year,
      sequence: seq,
      authorId: input.authorId,
      projectId: input.projectId,
      startDate: parseIsoDate(input.startDate),
      endDate: parseIsoDate(input.endDate),
      businessDays: countBusinessDays(input.startDate, input.endDate),
      coverId: input.coverId,
      approverId: input.approverId,
      notes: input.notes ?? null,
      status: input.status ?? 'IN_REVIEW',
      submittedAt: input.submittedAt ?? new Date(),
      events: {
        create: [
          { type: 'SUBMITTED', actorId: input.authorId, description: 'autor' },
          {
            type: 'IN_REVIEW',
            actorId: input.authorId,
            description: 'encaminhada',
            metadata: { conflicts: [], conflictNotes: [] },
          },
        ],
      },
    },
  });
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
  await db.project.update({ where: { id: orion.id }, data: { defaultApproverId: caio.id } });
  await createSettings();
  await db.defaultApprover.create({ data: { settingsId: 1, userId: caio.id, position: 0 } });
  return { orion, atlas, caio, marina, pedro, julia, thiago };
}
