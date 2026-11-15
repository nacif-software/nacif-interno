/**
 * Importação da planilha "Controle" (histórico completo): pessoas, projetos, lançamentos do saldo,
 * comunicações, decisões e eventos. Lê um JSON gerado fora do repositório (dados pessoais nunca
 * entram no git) e grava num único `wrangler d1 execute`, idempotente por ids determinísticos.
 *
 *   pnpm --filter @nacif/api import-sheet <arquivo.json> --local            # D1 local
 *   pnpm --filter @nacif/api import-sheet <arquivo.json> [--admin=email]   # D1 remoto (produção)
 *
 * No fim compara o saldo calculado de cada pessoa com o esperado (aba Saldo) e falha se divergir.
 * Ver `docs/deploy.md`, seção "Importação da planilha".
 */
import {
  APP_TIMEZONE,
  countBusinessDays,
  formatCommunicationCode,
  formatDayMonth,
  isoDateSchema,
  isoDateYear,
  nacifEmailSchema,
  toZonedIsoDate,
} from '@nacif/shared';
import { eq, sql } from 'drizzle-orm';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  availabilityDefaultApprovers,
  availabilityLedgerEntries,
  availabilitySettings,
  communicationCounters,
  communications,
  decisions,
  flowEvents,
  projects,
  userProjects,
  users,
  type FlowEventMetadata,
} from '../src/db/schema';
import { apiDir, d1Execute, literal, qb, toStatement, type D1Target } from './lib/sql';

// ------------------------------------------------------------------ entrada

const personSchema = z.object({
  email: nacifEmailSchema,
  name: z.string().trim().min(2),
  active: z.boolean(),
  creditBaseDate: isoDateSchema.nullable(),
  role: z.enum(['MEMBER', 'APPROVER']),
  projects: z.array(z.string().min(1)),
});
const grantSchema = z.object({
  email: nacifEmailSchema,
  date: isoDateSchema,
  days: z.number().int().positive(),
  entry: z.enum(['Automática', 'Manual']),
  note: z.string().nullable().optional(),
});
const saleSchema = z.object({
  email: nacifEmailSchema,
  date: isoDateSchema,
  days: z.number().int().positive(),
});
const requestSchema = z.object({
  id: z.string().min(1),
  email: nacifEmailSchema,
  status: z.enum(['APPROVED', 'IN_REVIEW', 'REJECTED', 'CANCELLED']),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  approverEmail: nacifEmailSchema.nullable(),
  days: z.number().int().min(0).nullable(),
  notes: z.string().nullable().optional(),
  updatedAt: z.string().datetime().nullable().optional(),
});
const fileSchema = z.object({
  exportedAt: isoDateSchema,
  daysPerYear: z.number().int().positive(),
  projects: z.array(z.string().min(1)),
  people: z.array(personSchema).min(1),
  grants: z.array(grantSchema),
  sales: z.array(saleSchema),
  requests: z.array(requestSchema),
  expectedBalances: z.record(z.string(), z.number().int()),
});
type SheetFile = z.infer<typeof fileSchema>;

function usage(message?: string): never {
  if (message) console.error(message);
  console.error(
    'Uso: pnpm --filter @nacif/api import-sheet <arquivo.json> [--local] [--admin=e-mail]',
  );
  process.exit(1);
}

function parseArgs(argv: string[]): { file: string; target: D1Target; admin: string } {
  const flags = argv.filter((a) => a.startsWith('--'));
  const positional = argv.filter((a) => !a.startsWith('--'));
  const unknown = flags.filter((f) => f !== '--local' && !f.startsWith('--admin='));
  if (unknown.length) usage(`Opção desconhecida: ${unknown.join(' ')}`);
  if (positional.length !== 1) usage();
  const admin = flags.find((f) => f.startsWith('--admin='))?.slice('--admin='.length);
  return {
    file: positional[0] ?? '',
    target: flags.includes('--local') ? 'local' : 'remote',
    admin: admin ?? 'wenderson@nacif.xyz',
  };
}

// ---------------------------------------------------------- estado do banco

interface ExistingUser {
  id: string;
  email: string;
  name: string;
}
interface ExistingProject {
  id: string;
  name: string;
}
interface ExistingSheetCommunication {
  id: string;
  year: number;
  sequence: number;
}

function query<T>(target: D1Target, sql: string): T[] {
  const output = d1Execute(target, ['--json', '--command', sql], 'pipe');
  const parsed = JSON.parse(output) as { results: T[] }[];
  return parsed[0]?.results ?? [];
}

function readState(target: D1Target) {
  return {
    users: query<ExistingUser>(target, 'select id, email, name from users'),
    projects: query<ExistingProject>(target, 'select id, name from projects'),
    maxSequence: query<{ year: number; max: number }>(
      target,
      "select year, max(sequence) as max from communications where id not like 'sheet-%' group by year",
    ),
    sheetCommunications: query<ExistingSheetCommunication>(
      target,
      "select id, year, sequence from communications where id like 'sheet-%'",
    ),
  };
}

// ----------------------------------------------------------------- montagem

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function buildStatements(file: SheetFile, state: ReturnType<typeof readState>, adminEmail: string) {
  const now = new Date();
  const statements: string[] = ['PRAGMA defer_foreign_keys = on;'];
  const summary = { projects: 0, newPeople: 0, updatedPeople: 0, ledger: 0, communications: 0 };

  // Projetos (por nome; `projects_name_key` resolve repetição)
  const projectId = new Map<string, string>();
  for (const name of file.projects) {
    const existing = state.projects.find((p) => p.name.toLowerCase() === name.toLowerCase());
    const id = existing?.id ?? `sheet-project-${slug(name)}`;
    projectId.set(name, id);
    if (!existing) {
      statements.push(toStatement(qb.insert(projects).values({ id, name }).onConflictDoNothing()));
      summary.projects++;
    }
  }

  // Pessoas (por e-mail): novas entram convidadas; existentes só atualizam nome, atividade, papel e data base
  const userId = new Map<string, string>();
  for (const person of file.people) {
    const existing = state.users.find((u) => u.email === person.email);
    const id = existing?.id ?? `sheet-user-${slug(person.email.split('@')[0] ?? person.email)}`;
    userId.set(person.email, id);
    const values = {
      name: person.name,
      active: person.active,
      creditBaseDate: person.creditBaseDate,
      updatedAt: now,
    };
    if (existing) {
      summary.updatedPeople++;
      statements.push(
        toStatement(
          qb
            .update(users)
            .set({ ...values, role: person.role })
            .where(eq(users.email, person.email)),
        ),
      );
    } else {
      summary.newPeople++;
      statements.push(
        toStatement(
          qb
            .insert(users)
            .values({ id, email: person.email, role: person.role, invitedAt: now, ...values })
            .onConflictDoNothing(),
        ),
      );
    }
    for (const projectName of person.projects) {
      const pid = projectId.get(projectName);
      if (!pid) throw new Error(`Projeto desconhecido para ${person.email}: ${projectName}`);
      statements.push(
        toStatement(
          qb.insert(userProjects).values({ userId: id, projectId: pid }).onConflictDoNothing(),
        ),
      );
    }
  }
  const adminId = state.users.find((u) => u.email === adminEmail)?.id ?? null;
  const idOf = (email: string) => {
    const id = userId.get(email) ?? state.users.find((u) => u.email === email)?.id;
    if (!id) throw new Error(`Pessoa não mapeada: ${email}`);
    return id;
  };
  const nameOf = (email: string) =>
    file.people.find((p) => p.email === email)?.name ??
    state.users.find((u) => u.email === email)?.name ??
    email;

  // Configurações: dias por ano e aprovadores padrão (APPROVER na ordem do arquivo)
  statements.push(
    toStatement(
      qb
        .insert(availabilitySettings)
        .values({ id: 1, daysPerYear: file.daysPerYear })
        .onConflictDoUpdate({
          target: availabilitySettings.id,
          set: { daysPerYear: file.daysPerYear },
        }),
    ),
  );
  const approvers = file.people.filter((p) => p.role === 'APPROVER' && p.active);
  if (approvers.length > 0) {
    statements.push(toStatement(qb.delete(availabilityDefaultApprovers)));
    approvers.forEach((p, position) =>
      statements.push(
        toStatement(
          qb
            .insert(availabilityDefaultApprovers)
            .values({ settingsId: 1, userId: idOf(p.email), position }),
        ),
      ),
    );
  }

  // Lançamentos: "Automática" vira ACCRUAL com o ano (o cron não duplica); "Manual" vira GRANT com a nota
  file.grants.forEach((g, i) => {
    const accrual = g.entry === 'Automática';
    statements.push(
      toStatement(
        qb
          .insert(availabilityLedgerEntries)
          .values({
            id: `sheet-grant-${i + 1}`,
            userId: idOf(g.email),
            type: accrual ? 'ACCRUAL' : 'GRANT',
            days: g.days,
            referenceDate: g.date,
            referenceYear: accrual ? isoDateYear(g.date) : null,
            note: accrual ? null : g.note?.trim() || 'Importado da planilha',
            createdById: accrual ? null : adminId,
          })
          .onConflictDoNothing(),
      ),
    );
    summary.ledger++;
  });
  file.sales.forEach((s, i) => {
    statements.push(
      toStatement(
        qb
          .insert(availabilityLedgerEntries)
          .values({
            id: `sheet-sale-${i + 1}`,
            userId: idOf(s.email),
            type: 'SALE',
            days: s.days,
            referenceDate: s.date,
            referenceYear: null,
            note: 'Venda registrada na planilha',
            createdById: adminId,
          })
          .onConflictDoNothing(),
      ),
    );
    summary.ledger++;
  });

  // Comunicações: código sequencial por ano na ordem de envio, continuando o contador existente
  const fallbackApprover = approvers[0]?.email;
  const sequenceByYear = new Map<number, number>(state.maxSequence.map((r) => [r.year, r.max]));
  for (const c of state.sheetCommunications) {
    sequenceByYear.set(c.year, Math.max(sequenceByYear.get(c.year) ?? 0, c.sequence));
  }
  const ordered = [...file.requests].sort((a, b) =>
    (a.updatedAt ?? a.startDate).localeCompare(b.updatedAt ?? b.startDate),
  );
  for (const r of ordered) {
    const id = `sheet-comm-${r.id}`;
    const submittedAt = r.updatedAt ? new Date(r.updatedAt) : new Date(`${r.startDate}T12:00:00Z`);
    const year = isoDateYear(toZonedIsoDate(submittedAt, APP_TIMEZONE));
    const existing = state.sheetCommunications.find((c) => c.id === id);
    const sequence = existing?.sequence ?? (sequenceByYear.get(year) ?? 0) + 1;
    if (!existing) sequenceByYear.set(year, sequence);
    const approverEmail = r.approverEmail ?? fallbackApprover;
    if (!approverEmail) throw new Error(`Sem aprovador para a solicitação ${r.id}`);
    const authorId = idOf(r.email);
    const approverId = idOf(approverEmail);
    const businessDays = countBusinessDays(r.startDate, r.endDate);
    const deductedDays = r.status === 'APPROVED' ? (r.days ?? businessDays) : null;
    const notes = [r.notes?.trim(), r.approverEmail ? null : 'Registrado manualmente na planilha.']
      .filter(Boolean)
      .join(' ');
    statements.push(
      toStatement(
        qb
          .insert(communications)
          .values({
            id,
            code: formatCommunicationCode(year, sequence),
            year,
            sequence,
            authorId,
            startDate: r.startDate,
            endDate: r.endDate,
            businessDays,
            deductedDays,
            coverId: null,
            approverId,
            notes: notes || null,
            status: r.status,
            submittedAt,
            cancelledAt: r.status === 'CANCELLED' ? submittedAt : null,
          })
          .onConflictDoNothing(),
      ),
    );
    const approverName = nameOf(approverEmail);
    const events: {
      suffix: string;
      type: 'SUBMITTED' | 'IN_REVIEW' | 'DECISION' | 'CANCELLED';
      description: string;
      metadata: FlowEventMetadata | null;
    }[] = [
      { suffix: 'submitted', type: 'SUBMITTED', description: nameOf(r.email), metadata: null },
      {
        suffix: 'in-review',
        type: 'IN_REVIEW',
        description: `Encaminhada a ${approverName}`,
        metadata: { conflicts: [], conflictNotes: [] },
      },
    ];
    if (r.status === 'APPROVED' || r.status === 'REJECTED') {
      const justification =
        r.status === 'REJECTED'
          ? r.notes?.trim() || 'Recusada na planilha, sem justificativa registrada.'
          : null;
      statements.push(
        toStatement(
          qb
            .insert(decisions)
            .values({
              id: `sheet-decision-${r.id}`,
              communicationId: id,
              type: r.status,
              deciderId: approverId,
              decidedAt: submittedAt,
              justification,
              batchId: null,
            })
            .onConflictDoNothing(),
        ),
      );
      const adjusted =
        r.status === 'APPROVED' && deductedDays !== null && deductedDays !== businessDays;
      events.push({
        suffix: 'decision',
        type: 'DECISION',
        description:
          r.status === 'APPROVED'
            ? adjusted
              ? `Aprovada por ${approverName} (${deductedDays} ${deductedDays === 1 ? 'dia descontado' : 'dias descontados'})`
              : `Aprovada por ${approverName}`
            : `Recusada por ${approverName}`,
        metadata: {
          decision: r.status,
          justification,
          batchId: null,
          ...(adjusted && deductedDays !== null ? { deductedDays } : {}),
        },
      });
    }
    if (r.status === 'CANCELLED') {
      events.push({
        suffix: 'cancelled',
        type: 'CANCELLED',
        description: `Cancelada pelo autor em ${formatDayMonth(toZonedIsoDate(submittedAt, APP_TIMEZONE))}.`,
        metadata: null,
      });
    }
    for (const e of events) {
      statements.push(
        toStatement(
          qb
            .insert(flowEvents)
            .values({
              id: `sheet-event-${r.id}-${e.suffix}`,
              communicationId: id,
              type: e.type,
              actorId: e.type === 'DECISION' ? approverId : authorId,
              occurredAt: submittedAt,
              description: e.description,
              metadata: e.metadata,
            })
            .onConflictDoNothing(),
        ),
      );
    }
    summary.communications++;
  }
  for (const [year, lastSequence] of sequenceByYear) {
    statements.push(
      toStatement(
        qb
          .insert(communicationCounters)
          .values({ year, lastSequence })
          .onConflictDoUpdate({
            target: communicationCounters.year,
            set: { lastSequence: sql`max(${communicationCounters.lastSequence}, ${lastSequence})` },
          }),
      ),
    );
  }
  return { statements, summary };
}

// ------------------------------------------------------------ verificação

function verifyBalances(target: D1Target, expected: Record<string, number>): boolean {
  const rows = query<{ email: string; balance: number }>(
    target,
    `select u.email,
       coalesce((select sum(case when l.type = 'SALE' then -l.days else l.days end)
                 from availability_ledger_entries l where l.user_id = u.id), 0)
       - coalesce((select sum(coalesce(c.deducted_days, c.business_days))
                   from communications c where c.author_id = u.id and c.status = 'APPROVED'), 0) as balance
     from users u where u.email in (${Object.keys(expected).map(literal).join(', ')})`,
  );
  let ok = true;
  console.log('\nSaldo calculado × planilha:');
  for (const [email, want] of Object.entries(expected)) {
    const got = rows.find((r) => r.email === email)?.balance;
    const mark = got === want ? 'ok' : 'DIVERGE';
    if (got !== want) ok = false;
    console.log(`  ${mark.padEnd(8)} ${email.padEnd(28)} sistema=${String(got)} planilha=${want}`);
  }
  return ok;
}

// ------------------------------------------------------------------- main

const { file, target, admin } = parseArgs(process.argv.slice(2));
const parsed = fileSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
if (!parsed.success) {
  console.error('JSON inválido:');
  for (const issue of parsed.error.issues)
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}
const data = parsed.data;
const where = target === 'local' ? 'D1 local' : 'D1 remoto (produção)';
console.log(
  `Importando ${file} no ${where}: ${data.people.length} pessoas, ${data.requests.length} solicitações.`,
);

const state = readState(target);
const { statements, summary } = buildStatements(data, state, admin);
const out = path.join(apiDir, '.wrangler', 'import-sheet.sql');
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, `${statements.join('\n')}\n`);
try {
  d1Execute(target, ['--file', out, '--yes'], 'pipe');
} finally {
  rmSync(out, { force: true });
}
console.log(
  `Gravado: ${summary.projects} projetos novos, ${summary.newPeople} pessoas novas, ${summary.updatedPeople} atualizadas, ${summary.ledger} lançamentos, ${summary.communications} comunicações.`,
);
const ok = verifyBalances(target, data.expectedBalances);
console.log(
  ok
    ? '\nSaldos conferem com a planilha.'
    : '\nSaldos divergem da planilha: confira as linhas marcadas antes de liberar o sistema.',
);
console.log(
  'Próximos passos: rodar o crédito anual (POST /api/disponibilidade/balance/accrual/run) e gerar os links de definição de senha na Administração.',
);
process.exit(ok ? 0 : 2);
