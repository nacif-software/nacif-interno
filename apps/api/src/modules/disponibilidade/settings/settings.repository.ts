import { asc, eq } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { batchAll, db } from '../../../db/client';
import { availabilityDefaultApprovers, availabilitySettings } from '../../../db/schema';
import type { SettingsRow } from '../../../db/types';

const SETTINGS_ID = 1;

function load(): Promise<SettingsRow | undefined> {
  return db().query.availabilitySettings.findFirst({
    where: eq(availabilitySettings.id, SETTINGS_ID),
    with: {
      defaultApprovers: {
        orderBy: [asc(availabilityDefaultApprovers.position)],
        with: { user: true },
      },
    },
  });
}

export const settingsRepository = {
  /** Garante a linha única (criada na primeira leitura) e devolve com aprovadores padrão ordenados. */
  async get(): Promise<SettingsRow> {
    const row = await load();
    if (row) return row;
    await db().insert(availabilitySettings).values({ id: SETTINGS_ID }).onConflictDoNothing();
    const created = await load();
    if (!created) throw new Error('Configurações não puderam ser criadas.');
    return created;
  },
  async update(data: {
    minNoticeDays: number;
    maxSimultaneousPerProject: number;
    defaultApproverIds: string[];
  }): Promise<SettingsRow> {
    const values = {
      minNoticeDays: data.minNoticeDays,
      maxSimultaneousPerProject: data.maxSimultaneousPerProject,
    };
    const statements: BatchItem<'sqlite'>[] = [
      db()
        .insert(availabilitySettings)
        .values({ id: SETTINGS_ID, ...values })
        .onConflictDoUpdate({ target: availabilitySettings.id, set: values }),
      db()
        .delete(availabilityDefaultApprovers)
        .where(eq(availabilityDefaultApprovers.settingsId, SETTINGS_ID)),
    ];
    if (data.defaultApproverIds.length > 0) {
      statements.push(
        db()
          .insert(availabilityDefaultApprovers)
          .values(
            data.defaultApproverIds.map((userId, position) => ({
              settingsId: SETTINGS_ID,
              userId,
              position,
            })),
          ),
      );
    }
    await batchAll(statements);
    return this.get();
  },
};
