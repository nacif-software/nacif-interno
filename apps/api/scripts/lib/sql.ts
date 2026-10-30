/**
 * Utilitários dos scripts Node que escrevem no D1 via `wrangler d1 execute`: montam SQL com o
 * query builder do Drizzle (sem conexão) e executam o arquivo gerado.
 */
import { drizzle } from 'drizzle-orm/d1';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

export const DATABASE = 'nacif-interno';
export const apiDir = path.resolve(import.meta.dirname, '..', '..');

export type D1Target = 'local' | 'remote';

/** Só monta SQL; nenhuma query é executada por aqui. */
export const qb = drizzle(null as never);

export function literal(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
  throw new Error(`Valor não suportado: ${typeof value}`);
}

/** Inline dos parâmetros (`?`) de uma query do Drizzle para gerar um arquivo .sql. */
export function toStatement(query: { toSQL(): { sql: string; params: unknown[] } }): string {
  const { sql: text, params } = query.toSQL();
  let i = 0;
  const inlined = text.replace(/\?/g, () => literal(params[i++]));
  if (i !== params.length) throw new Error('Parâmetros não casam com os placeholders.');
  return `${inlined};`;
}

/** Roda `wrangler d1 execute` no banco do projeto com os argumentos dados (`--file` ou `--command`). */
export function d1Execute(target: D1Target, args: string[], stdio: 'inherit' | 'pipe' = 'inherit') {
  return execFileSync(
    'pnpm',
    ['exec', 'wrangler', 'd1', 'execute', DATABASE, `--${target}`, ...args],
    { cwd: apiDir, stdio, encoding: 'utf8' },
  );
}
