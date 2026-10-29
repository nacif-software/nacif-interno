import { count, type SQL } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { db } from '../db/client';

/** Conta linhas de uma tabela (asserções diretas no banco dentro das specs). */
export async function countRows(table: SQLiteTable, where?: SQL): Promise<number> {
  const [row] = await db().select({ count: count() }).from(table).where(where);
  return row?.count ?? 0;
}
