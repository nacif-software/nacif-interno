/**
 * Dados de exemplo do design (docs/design-spec.md). Idempotente: usa upsert por e-mail, nome e código.
 * Senha de todos: SEED_PASSWORD (padrão nacif1234).
 */
import '../src/config/load-dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { countBusinessDays, parseIsoDate } from '@nacif/shared';
import bcrypt from 'bcryptjs';
import { PrismaClient, type CommunicationStatus } from '../src/generated/prisma/client';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL não definida');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const PASSWORD = process.env.SEED_PASSWORD ?? 'nacif1234';

const projects = [{ name: 'Órion' }, { name: 'Atlas' }, { name: 'Vega' }] as const;

const people = [
  { name: 'Caio Bertelli', email: 'caio@nacif.xyz', role: 'ADMIN', project: 'Órion', active: true },
  {
    name: 'Marina Duarte',
    email: 'marina@nacif.xyz',
    role: 'APPROVER',
    project: 'Órion',
    active: true,
  },
  {
    name: 'Pedro Nakano',
    email: 'pedro@nacif.xyz',
    role: 'MEMBER',
    project: 'Órion',
    active: true,
  },
  { name: 'Júlia Reis', email: 'julia@nacif.xyz', role: 'MEMBER', project: 'Atlas', active: true },
  {
    name: 'Rafael Sousa',
    email: 'rafael@nacif.xyz',
    role: 'MEMBER',
    project: 'Atlas',
    active: true,
  },
  {
    name: 'Bruna Alencar',
    email: 'bruna@nacif.xyz',
    role: 'MEMBER',
    project: 'Vega',
    active: true,
  },
  {
    name: 'Thiago Lemos',
    email: 'thiago@nacif.xyz',
    role: 'MEMBER',
    project: 'Vega',
    active: false,
  },
] as const;

type Person = (typeof people)[number]['name'];

interface SeedCommunication {
  code: string;
  author: Person;
  cover: Person;
  approver: Person;
  startDate: string;
  endDate: string;
  status: CommunicationStatus;
  submittedAt: string;
  notes?: string;
  decision?: { type: 'APPROVED' | 'REJECTED'; by: Person; at: string; justification?: string };
  cancelledAt?: string;
  conflictWith?: { name: Person; startDate: string; endDate: string };
}

const communications: SeedCommunication[] = [
  // Marina (tela 02)
  {
    code: '2026-0151',
    author: 'Marina Duarte',
    cover: 'Pedro Nakano',
    approver: 'Caio Bertelli',
    startDate: '2026-05-18',
    endDate: '2026-05-22',
    status: 'CANCELLED',
    submittedAt: '2026-05-04T12:00:00Z',
    cancelledAt: '2026-05-10T13:00:00Z',
  },
  {
    code: '2026-0160',
    author: 'Marina Duarte',
    cover: 'Pedro Nakano',
    approver: 'Caio Bertelli',
    startDate: '2026-07-02',
    endDate: '2026-07-04',
    status: 'REJECTED',
    submittedAt: '2026-06-12T14:00:00Z',
    decision: {
      type: 'REJECTED',
      by: 'Caio Bertelli',
      at: '2026-06-12T20:40:00Z',
      justification: 'Sobreposição com a entrega final do Órion. Podemos retomar após 20/06.',
    },
  },
  {
    code: '2026-0172',
    author: 'Marina Duarte',
    cover: 'Pedro Nakano',
    approver: 'Caio Bertelli',
    startDate: '2026-09-14',
    endDate: '2026-09-18',
    status: 'APPROVED',
    submittedAt: '2026-08-02T15:00:00Z',
    decision: { type: 'APPROVED', by: 'Caio Bertelli', at: '2026-08-03T12:30:00Z' },
  },
  // Pedro aprovada 06–08 out (gera o conflito da tela 03/04)
  {
    code: '2026-0180',
    author: 'Pedro Nakano',
    cover: 'Marina Duarte',
    approver: 'Caio Bertelli',
    startDate: '2026-10-06',
    endDate: '2026-10-08',
    status: 'APPROVED',
    submittedAt: '2026-08-15T12:00:00Z',
    decision: { type: 'APPROVED', by: 'Caio Bertelli', at: '2026-08-16T12:00:00Z' },
  },
  // Caio aprovada 01–02 out (tela 06)
  {
    code: '2026-0181',
    author: 'Caio Bertelli',
    cover: 'Marina Duarte',
    approver: 'Marina Duarte',
    startDate: '2026-10-01',
    endDate: '2026-10-02',
    status: 'APPROVED',
    submittedAt: '2026-08-18T12:00:00Z',
    decision: { type: 'APPROVED', by: 'Marina Duarte', at: '2026-08-18T15:00:00Z' },
  },
  // Thiago aprovada 13–15 out (tela 06)
  {
    code: '2026-0182',
    author: 'Thiago Lemos',
    cover: 'Bruna Alencar',
    approver: 'Caio Bertelli',
    startDate: '2026-10-13',
    endDate: '2026-10-15',
    status: 'APPROVED',
    submittedAt: '2026-08-19T12:00:00Z',
    decision: { type: 'APPROVED', by: 'Caio Bertelli', at: '2026-08-19T16:00:00Z' },
  },
  // Fila (tela 05), em ordem de envio
  {
    code: '2026-0183',
    author: 'Pedro Nakano',
    cover: 'Marina Duarte',
    approver: 'Caio Bertelli',
    startDate: '2026-10-12',
    endDate: '2026-10-16',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-20T12:00:00Z',
  },
  {
    code: '2026-0184',
    author: 'Marina Duarte',
    cover: 'Júlia Reis',
    approver: 'Caio Bertelli',
    startDate: '2026-10-05',
    endDate: '2026-10-09',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-21T12:12:00Z',
    notes:
      'Deixo o handoff do Órion documentado até 02/10. Fico acessível para emergências pelo celular.',
    conflictWith: { name: 'Pedro Nakano', startDate: '2026-10-06', endDate: '2026-10-08' },
  },
  {
    code: '2026-0185',
    author: 'Júlia Reis',
    cover: 'Rafael Sousa',
    approver: 'Caio Bertelli',
    startDate: '2026-10-19',
    endDate: '2026-10-23',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-20T13:00:00Z',
  },
  {
    code: '2026-0186',
    author: 'Rafael Sousa',
    cover: 'Pedro Nakano',
    approver: 'Caio Bertelli',
    startDate: '2026-10-28',
    endDate: '2026-11-03',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-22T12:00:00Z',
  },
  {
    code: '2026-0187',
    author: 'Bruna Alencar',
    cover: 'Caio Bertelli',
    approver: 'Caio Bertelli',
    startDate: '2026-11-09',
    endDate: '2026-11-10',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-23T12:00:00Z',
  },
  {
    code: '2026-0188',
    author: 'Thiago Lemos',
    cover: 'Bruna Alencar',
    approver: 'Caio Bertelli',
    startDate: '2026-11-16',
    endDate: '2026-11-27',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-24T12:00:00Z',
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const projectIds = new Map<string, string>();
  for (const p of projects) {
    const row = await db.project.upsert({
      where: { name: p.name },
      create: { name: p.name },
      update: {},
    });
    projectIds.set(p.name, row.id);
  }

  const userIds = new Map<string, string>();
  for (const person of people) {
    const data = {
      name: person.name,
      role: person.role,
      active: person.active,
      passwordHash,
      projectId: projectIds.get(person.project) ?? null,
    };
    const row = await db.user.upsert({
      where: { email: person.email },
      create: { email: person.email, ...data },
      update: data,
    });
    userIds.set(person.name, row.id);
  }
  const id = (name: Person) => {
    const v = userIds.get(name);
    if (!v) throw new Error(`Pessoa não encontrada: ${name}`);
    return v;
  };

  await db.project.update({
    where: { name: 'Órion' },
    data: { defaultApproverId: id('Caio Bertelli') },
  });
  await db.project.update({
    where: { name: 'Atlas' },
    data: { defaultApproverId: id('Marina Duarte') },
  });
  await db.project.update({
    where: { name: 'Vega' },
    data: { defaultApproverId: id('Caio Bertelli') },
  });

  await db.availabilitySettings.upsert({
    where: { id: 1 },
    create: { id: 1, minNoticeDays: 7, maxSimultaneousPerProject: 2 },
    update: { minNoticeDays: 7, maxSimultaneousPerProject: 2 },
  });
  await db.defaultApprover.deleteMany({ where: { settingsId: 1 } });
  await db.defaultApprover.createMany({
    data: [
      { settingsId: 1, userId: id('Caio Bertelli'), position: 0 },
      { settingsId: 1, userId: id('Marina Duarte'), position: 1 },
    ],
  });

  let maxSeq = 0;
  for (const c of communications) {
    const [yearStr, seqStr] = c.code.split('-') as [string, string];
    const year = Number(yearStr);
    const sequence = Number(seqStr);
    maxSeq = Math.max(maxSeq, sequence);
    const authorProject = people.find((p) => p.name === c.author)?.project ?? 'Órion';
    const submittedAt = new Date(c.submittedAt);
    const base = {
      year,
      sequence,
      authorId: id(c.author),
      projectId: projectIds.get(authorProject) ?? '',
      startDate: parseIsoDate(c.startDate),
      endDate: parseIsoDate(c.endDate),
      businessDays: countBusinessDays(c.startDate, c.endDate),
      coverId: id(c.cover),
      approverId: id(c.approver),
      notes: c.notes ?? null,
      status: c.status,
      submittedAt,
      cancelledAt: c.cancelledAt ? new Date(c.cancelledAt) : null,
    };
    const existing = await db.communication.findUnique({ where: { code: c.code } });
    if (existing) {
      await db.communication.update({ where: { id: existing.id }, data: base });
      continue;
    }
    const row = await db.communication.create({ data: { code: c.code, ...base } });
    await db.flowEvent.create({
      data: {
        communicationId: row.id,
        type: 'SUBMITTED',
        actorId: id(c.author),
        occurredAt: submittedAt,
        description: c.author,
      },
    });
    await db.flowEvent.create({
      data: {
        communicationId: row.id,
        type: 'IN_REVIEW',
        actorId: id(c.author),
        occurredAt: submittedAt,
        description: `Encaminhada a ${c.approver}`,
        metadata: c.conflictWith
          ? {
              conflicts: [
                {
                  userId: id(c.conflictWith.name),
                  name: c.conflictWith.name,
                  startDate: c.conflictWith.startDate,
                  endDate: c.conflictWith.endDate,
                  status: 'APPROVED',
                },
              ],
              conflictNotes: [`Conflito sinalizado com ${c.conflictWith.name} (06–08 out).`],
            }
          : { conflicts: [], conflictNotes: [] },
      },
    });
    if (c.decision) {
      const at = new Date(c.decision.at);
      await db.decision.create({
        data: {
          communicationId: row.id,
          type: c.decision.type,
          deciderId: id(c.decision.by),
          decidedAt: at,
          justification: c.decision.justification ?? null,
        },
      });
      await db.flowEvent.create({
        data: {
          communicationId: row.id,
          type: 'DECISION',
          actorId: id(c.decision.by),
          occurredAt: at,
          description:
            c.decision.type === 'APPROVED'
              ? `Aprovada por ${c.decision.by}`
              : `Recusada por ${c.decision.by}`,
          metadata: {
            decision: c.decision.type,
            justification: c.decision.justification ?? null,
            batchId: null,
          },
        },
      });
    }
    if (c.cancelledAt) {
      await db.flowEvent.create({
        data: {
          communicationId: row.id,
          type: 'CANCELLED',
          actorId: id(c.author),
          occurredAt: new Date(c.cancelledAt),
          description: 'Cancelada pelo autor em 10 mai.',
        },
      });
    }
  }

  const counter = await db.communicationCounter.findUnique({ where: { year: 2026 } });
  await db.communicationCounter.upsert({
    where: { year: 2026 },
    create: { year: 2026, lastSequence: maxSeq },
    update: { lastSequence: { set: Math.max(maxSeq, counter?.lastSequence ?? 0) } },
  });

  console.log(
    `Seed concluído: ${people.length} pessoas, ${projects.length} projetos, ${communications.length} comunicações. Senha: ${PASSWORD}`,
  );
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
