import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, beforeEach } from 'vitest';
import { bindConfig } from '../config/env';
import { bindDb, db } from '../db/client';
import {
  approvalBatches,
  availabilityDefaultApprovers,
  availabilitySettings,
  communicationCounters,
  communications,
  decisions,
  flowEvents,
  passwordSetupTokens,
  projects,
  sessions,
  users,
} from '../db/schema';

/**
 * O plugin isola o storage por arquivo de teste, não por teste: aplicamos as migrações uma vez
 * por arquivo e limpamos as tabelas antes de cada teste (filhos antes dos pais, por causa das FKs).
 */
beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  bindConfig(env);
  bindDb(env.DB);
});

beforeEach(async () => {
  bindConfig(env);
  bindDb(env.DB);
  await db().batch([
    db().delete(flowEvents),
    db().delete(decisions),
    db().delete(approvalBatches),
    db().delete(communications),
    db().delete(communicationCounters),
    db().delete(availabilityDefaultApprovers),
    db().delete(availabilitySettings),
    db().delete(passwordSetupTokens),
    db().delete(sessions),
    db().delete(users),
    db().delete(projects),
  ]);
});
