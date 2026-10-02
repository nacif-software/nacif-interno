import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../../config/env';
import { PrismaClient } from '../../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const db = new PrismaClient({ adapter });

export type Db = typeof db;
/** Cliente dentro de uma transação interativa. */
export type Tx = Parameters<Parameters<Db['$transaction']>[0]>[0];
export type DbOrTx = Db | Tx;
