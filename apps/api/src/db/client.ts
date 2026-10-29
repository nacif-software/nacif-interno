import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as relations from './relations';
import * as schema from './schema';

const fullSchema = { ...schema, ...relations };

export type Db = DrizzleD1Database<typeof fullSchema>;

const instances = new WeakMap<D1Database, Db>();

/** Uma instância do Drizzle por binding (o binding é o mesmo objeto em todas as requisições do isolate). */
export function createDb(d1: D1Database): Db {
  let db = instances.get(d1);
  if (!db) {
    db = drizzle(d1, { schema: fullSchema });
    instances.set(d1, db);
  }
  return db;
}

let current: Db | null = null;

/** Chamado no início de cada requisição (e no setup dos testes) com `env.DB`. */
export function bindDb(d1: D1Database): Db {
  current = createDb(d1);
  return current;
}

/** Banco da requisição atual. Repositórios usam isto em vez de receber o `db` por parâmetro. */
export function db(): Db {
  if (!current) throw new Error('Banco não vinculado: chame bindDb(env.DB) antes.');
  return current;
}

export { schema };
