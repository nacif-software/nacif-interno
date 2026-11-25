import {
  createExecutionContext,
  createScheduledController,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { db } from '../db/client';
import { addDays, APP_TIMEZONE, todayIso } from '@nacif/shared';
import { eq } from 'drizzle-orm';
import { communications, passwordSetupTokens, sessions } from '../db/schema';
import { createCommunication, createHoliday, createUser, seedTeam } from '../test/factories';
import { countRows } from '../test/db';
import worker from '../worker';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('cron de manutenção', () => {
  it('apaga sessões e tokens expirados e mantém os válidos', async () => {
    const user = await createUser();
    const now = new Date();
    await db()
      .insert(sessions)
      .values([
        { id: 'expired', userId: user.id, expiresAt: new Date(now.getTime() - DAY_MS) },
        { id: 'valid', userId: user.id, expiresAt: new Date(now.getTime() + DAY_MS) },
      ]);
    await db()
      .insert(passwordSetupTokens)
      .values([
        { tokenHash: 'expired', userId: user.id, expiresAt: new Date(now.getTime() - DAY_MS) },
        {
          tokenHash: 'used-long-ago',
          userId: user.id,
          expiresAt: new Date(now.getTime() + DAY_MS),
          usedAt: new Date(now.getTime() - 40 * DAY_MS),
        },
        { tokenHash: 'valid', userId: user.id, expiresAt: new Date(now.getTime() + DAY_MS) },
      ]);

    const controller = createScheduledController({ scheduledTime: now, cron: '0 3 * * *' });
    const ctx = createExecutionContext();
    await worker.scheduled(controller, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(await countRows(sessions)).toBe(1);
    expect(await countRows(passwordSetupTokens)).toBe(1);
  });

  it('reconta os dias úteis das comunicações futuras pelo calendário de feriados', async () => {
    const { caio, pedro } = await seedTeam();
    let monday = addDays(todayIso(APP_TIMEZONE), 14);
    while (new Date(`${monday}T00:00:00Z`).getUTCDay() !== 1) monday = addDays(monday, 1);
    const c = await createCommunication({
      authorId: pedro.id,
      approverId: caio.id,
      startDate: monday,
      endDate: addDays(monday, 4),
    });
    await createHoliday({ date: monday });

    const controller = createScheduledController({ scheduledTime: new Date(), cron: '0 3 * * *' });
    const ctx = createExecutionContext();
    await worker.scheduled(controller, env, ctx);
    await waitOnExecutionContext(ctx);

    const row = await db().query.communications.findFirst({ where: eq(communications.id, c.id) });
    expect(row?.businessDays).toBe(4);
  });
});
