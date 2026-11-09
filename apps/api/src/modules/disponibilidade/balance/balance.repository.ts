import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { batchAll, db } from '../../../db/client';
import { availabilityLedgerEntries, communications, users } from '../../../db/schema';
import type { LedgerEntry, NewLedgerEntry, User } from '../../../db/types';

/**
 * `users.id` da consulta externa, em texto: num campo de `select` de nível superior o Drizzle tira o
 * qualificador da coluna (`"id"`), que dentro das subqueries passaria a apontar para a tabela interna.
 */
const outerUserId = sql.raw('"users"."id"');
/** Créditos menos vendas da pessoa. */
const ledgerTotal = sql<number>`coalesce((
  select sum(case when l.type = 'SALE' then -l.days else l.days end)
  from ${availabilityLedgerEntries} l where l.user_id = ${outerUserId}
), 0)`;
/** Dias descontados das comunicações aprovadas (derivado do status: o undo de lote corrige sozinho). */
const deductedTotal = sql<number>`coalesce((
  select sum(coalesce(c.deducted_days, c.business_days))
  from ${communications} c where c.author_id = ${outerUserId} and c.status = 'APPROVED'
), 0)`;
const balanceExpr = sql<number>`${ledgerTotal} - ${deductedTotal}`.mapWith(Number);
/** Data do último movimento (lançamento ou início de comunicação aprovada); null se nenhum. */
const lastEntryDate = sql<string | null>`(
  select max(d) from (
    select max(l.reference_date) as d from ${availabilityLedgerEntries} l where l.user_id = ${outerUserId}
    union all
    select max(c.start_date) from ${communications} c where c.author_id = ${outerUserId} and c.status = 'APPROVED'
  )
)`;

/** Linhas por `insert` para ficar abaixo do limite de parâmetros do D1 (~100 por statement). */
const INSERT_CHUNK = 10;
/** Ids por `in (...)`, pelo mesmo limite. */
const IN_CHUNK = 90;

function chunked<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export type LedgerEntryRow = LedgerEntry & { createdBy: User | null };

export const balanceRepository = {
  async balances(userIds: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    for (const ids of chunked(userIds, IN_CHUNK)) {
      const rows = await db()
        .select({ userId: users.id, balance: balanceExpr })
        .from(users)
        .where(inArray(users.id, ids));
      for (const r of rows) result.set(r.userId, r.balance);
    }
    return result;
  },
  async balanceOf(userId: string): Promise<number> {
    return (await this.balances([userId])).get(userId) ?? 0;
  },
  /** Saldo e último movimento de todas as pessoas (Administração). */
  overview() {
    return db()
      .select({ user: users, balance: balanceExpr, lastEntryDate })
      .from(users)
      .orderBy(desc(users.active), sql`${users.name} collate nocase`);
  },
  entriesOf(userId: string): Promise<LedgerEntryRow[]> {
    return db().query.availabilityLedgerEntries.findMany({
      where: eq(availabilityLedgerEntries.userId, userId),
      with: { createdBy: true },
      orderBy: [desc(availabilityLedgerEntries.referenceDate)],
    });
  },
  approvedOf(userId: string) {
    return db().query.communications.findMany({
      where: and(eq(communications.authorId, userId), eq(communications.status, 'APPROVED')),
      orderBy: [desc(communications.startDate)],
    });
  },
  async insert(entry: NewLedgerEntry): Promise<LedgerEntry> {
    const [row] = await db().insert(availabilityLedgerEntries).values(entry).returning();
    if (!row) throw new Error('Lançamento não gravado.');
    return row;
  },
  /** Anos já creditados automaticamente, por pessoa. */
  async creditedYears(userIds: string[]): Promise<Map<string, Set<number>>> {
    const result = new Map<string, Set<number>>();
    for (const ids of chunked(userIds, IN_CHUNK)) {
      const rows = await db()
        .select({
          userId: availabilityLedgerEntries.userId,
          year: availabilityLedgerEntries.referenceYear,
        })
        .from(availabilityLedgerEntries)
        .where(
          and(
            eq(availabilityLedgerEntries.type, 'ACCRUAL'),
            inArray(availabilityLedgerEntries.userId, ids),
          ),
        );
      for (const r of rows) {
        if (r.year === null) continue;
        const set = result.get(r.userId) ?? new Set<number>();
        set.add(r.year);
        result.set(r.userId, set);
      }
    }
    return result;
  },
  /**
   * Insere créditos anuais ignorando os que já existem (índice único por pessoa e ano).
   * Devolve quantos entraram de fato.
   */
  async insertAccruals(entries: NewLedgerEntry[]): Promise<number> {
    if (entries.length === 0) return 0;
    const results = await batchAll(
      chunked(entries, INSERT_CHUNK).map((chunk) =>
        db()
          .insert(availabilityLedgerEntries)
          .values(chunk)
          .onConflictDoNothing()
          .returning({ id: availabilityLedgerEntries.id }),
      ),
    );
    return results.reduce((total, rows) => total + rows.length, 0);
  },
};
