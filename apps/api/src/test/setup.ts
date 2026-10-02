import { afterAll, beforeEach } from 'vitest';
import { db } from '../infra/prisma/client';

/** Limpa todas as tabelas antes de cada teste (ordem não importa com TRUNCATE ... CASCADE). */
beforeEach(async () => {
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      flow_events, decisions, approval_batches, communications, communication_counters,
      availability_default_approvers, availability_settings,
      password_setup_tokens, sessions, users, projects
    RESTART IDENTITY CASCADE
  `);
});

afterAll(async () => {
  await db.$disconnect();
});
