import { createScheduledController, env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { db } from '../db/client';
import { passwordSetupTokens, sessions } from '../db/schema';
import { createUser } from '../test/factories';
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
    await worker.scheduled(controller, env);

    expect(await countRows(sessions)).toBe(1);
    expect(await countRows(passwordSetupTokens)).toBe(1);
  });
});
