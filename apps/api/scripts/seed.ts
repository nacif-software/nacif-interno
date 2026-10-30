/**
 * Seed do D1 local: gera `.wrangler/seed.sql` a partir de `src/db/seed-data.ts` (upserts idempotentes)
 * e aplica com `wrangler d1 execute --local`. Nunca roda contra o banco remoto: produção não tem seed.
 *
 *   pnpm --filter @nacif/api seed            # gera e aplica no D1 local
 *   pnpm --filter @nacif/api seed --only-sql # só gera o arquivo
 */
import {
  APP_TIMEZONE,
  MESSAGES,
  countBusinessDays,
  formatCompactRange,
  formatDayMonth,
  toZonedIsoDate,
} from '@nacif/shared';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  availabilityDefaultApprovers,
  availabilitySettings,
  communicationCounters,
  communications,
  decisions,
  flowEvents,
  projects,
  users,
  type FlowEventMetadata,
} from '../src/db/schema';
import {
  SEED_COMMUNICATIONS,
  SEED_PEOPLE,
  SEED_PROJECTS,
  SEED_SETTINGS,
  type SeedPersonKey,
} from '../src/db/seed-data';
import { apiDir, d1Execute, qb, toStatement } from './lib/sql';

if (process.argv.includes('--remote')) {
  console.error(
    'O seed é só para o D1 local. Produção começa vazia: crie o primeiro administrador com `make create-admin email=...`.',
  );
  process.exit(1);
}

interface SeedEvent {
  id: string;
  type: 'SUBMITTED' | 'IN_REVIEW' | 'DECISION' | 'CANCELLED';
  occurredAt: Date;
  description: string;
  metadata: FlowEventMetadata | null;
  actorKey: SeedPersonKey;
}

const outFile = path.join(apiDir, '.wrangler', 'seed.sql');
const PASSWORD = process.env.SEED_PASSWORD ?? 'nacif1234';

const projectId = (name: string) => {
  const project = SEED_PROJECTS.find((p) => p.name === name);
  if (!project) throw new Error(`Projeto ${name} não existe no seed`);
  return project.id;
};
const person = (key: SeedPersonKey) => {
  const found = SEED_PEOPLE.find((p) => p.key === key);
  if (!found) throw new Error(`Pessoa ${key} não existe no seed`);
  return { ...found, id: `seed-user-${key}` };
};

async function buildStatements(): Promise<string[]> {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const statements: string[] = ['PRAGMA defer_foreign_keys = on;'];

  for (const p of SEED_PROJECTS) {
    statements.push(
      toStatement(
        qb
          .insert(projects)
          .values({ id: p.id, name: p.name, defaultApproverId: person(p.defaultApprover).id })
          .onConflictDoUpdate({
            target: projects.id,
            set: { name: p.name, defaultApproverId: person(p.defaultApprover).id },
          }),
      ),
    );
  }

  for (const p of SEED_PEOPLE) {
    const values = {
      name: p.name,
      email: p.email,
      role: p.role,
      active: p.active,
      passwordHash,
      projectId: projectId(p.project),
    };
    statements.push(
      toStatement(
        qb
          .insert(users)
          .values({ id: `seed-user-${p.key}`, ...values })
          .onConflictDoUpdate({ target: users.id, set: values }),
      ),
    );
  }

  const settings = {
    minNoticeDays: SEED_SETTINGS.minNoticeDays,
    maxSimultaneousPerProject: SEED_SETTINGS.maxSimultaneousPerProject,
  };
  statements.push(
    toStatement(
      qb
        .insert(availabilitySettings)
        .values({ id: 1, ...settings })
        .onConflictDoUpdate({ target: availabilitySettings.id, set: settings }),
    ),
    toStatement(qb.delete(availabilityDefaultApprovers)),
    ...SEED_SETTINGS.defaultApprovers.map((key, position) =>
      toStatement(
        qb
          .insert(availabilityDefaultApprovers)
          .values({ settingsId: 1, userId: person(key).id, position }),
      ),
    ),
  );

  let maxSequence = 0;
  for (const c of SEED_COMMUNICATIONS) {
    const [yearText, sequenceText] = c.code.split('-');
    const year = Number(yearText);
    const sequence = Number(sequenceText);
    maxSequence = Math.max(maxSequence, sequence);
    const id = `seed-comm-${c.code}`;
    const author = person(c.author);
    const approver = person(c.approver);
    const submittedAt = new Date(c.submittedAt);
    const row = {
      code: c.code,
      year,
      sequence,
      authorId: author.id,
      projectId: projectId(author.project),
      startDate: c.startDate,
      endDate: c.endDate,
      businessDays: countBusinessDays(c.startDate, c.endDate),
      coverId: person(c.cover).id,
      approverId: approver.id,
      notes: c.notes ?? null,
      status: c.status,
      submittedAt,
      cancelledAt: c.cancelledAt ? new Date(c.cancelledAt) : null,
    };
    statements.push(
      toStatement(
        qb
          .insert(communications)
          .values({ id, ...row })
          .onConflictDoUpdate({ target: communications.id, set: row }),
      ),
    );

    const conflict = c.conflictWith
      ? {
          userId: person(c.conflictWith.person).id,
          name: person(c.conflictWith.person).name,
          startDate: c.conflictWith.startDate,
          endDate: c.conflictWith.endDate,
          status: 'APPROVED',
        }
      : null;
    const events: SeedEvent[] = [
      {
        id: `seed-event-${c.code}-submitted`,
        type: 'SUBMITTED',
        occurredAt: submittedAt,
        description: author.name,
        metadata: null,
        actorKey: c.author,
      },
      {
        id: `seed-event-${c.code}-in-review`,
        type: 'IN_REVIEW',
        actorKey: c.author,
        occurredAt: submittedAt,
        description: `Encaminhada a ${approver.name}`,
        metadata: conflict
          ? {
              conflicts: [conflict],
              conflictNotes: [
                MESSAGES.conflictFlagged(
                  conflict.name,
                  formatCompactRange(conflict.startDate, conflict.endDate),
                ),
              ],
            }
          : { conflicts: [], conflictNotes: [] },
      },
    ];
    if (c.decision) {
      const decider = person(c.decision.by);
      const decidedAt = new Date(c.decision.at);
      statements.push(
        toStatement(
          qb
            .insert(decisions)
            .values({
              id: `seed-decision-${c.code}`,
              communicationId: id,
              type: c.decision.type,
              deciderId: decider.id,
              decidedAt,
              justification: c.decision.justification ?? null,
              batchId: null,
            })
            .onConflictDoNothing(),
        ),
      );
      events.push({
        id: `seed-event-${c.code}-decision`,
        type: 'DECISION',
        actorKey: c.decision.by,
        occurredAt: decidedAt,
        description:
          c.decision.type === 'APPROVED'
            ? `Aprovada por ${decider.name}`
            : `Recusada por ${decider.name}`,
        metadata: {
          decision: c.decision.type,
          justification: c.decision.justification ?? null,
          batchId: null,
        },
      });
    }
    if (c.cancelledAt) {
      const cancelledAt = new Date(c.cancelledAt);
      events.push({
        id: `seed-event-${c.code}-cancelled`,
        type: 'CANCELLED',
        actorKey: c.author,
        occurredAt: cancelledAt,
        description: `Cancelada pelo autor em ${formatDayMonth(toZonedIsoDate(cancelledAt, APP_TIMEZONE))}.`,
        metadata: null,
      });
    }
    for (const { actorKey, ...e } of events) {
      statements.push(
        toStatement(
          qb
            .insert(flowEvents)
            .values({ ...e, communicationId: id, actorId: person(actorKey).id })
            .onConflictDoNothing(),
        ),
      );
    }
  }

  statements.push(
    toStatement(
      qb
        .insert(communicationCounters)
        .values({ year: 2026, lastSequence: maxSequence })
        .onConflictDoUpdate({
          target: communicationCounters.year,
          set: { lastSequence: sql`max(${communicationCounters.lastSequence}, ${maxSequence})` },
        }),
    ),
  );
  return statements;
}

const statements = await buildStatements();
mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, `${statements.join('\n')}\n`);
console.log(`Seed gerado em ${path.relative(apiDir, outFile)} (${statements.length} statements).`);

if (!process.argv.includes('--only-sql')) {
  d1Execute('local', ['--file', outFile, '--yes']);
  console.log('Seed aplicado no D1 local.');
}
