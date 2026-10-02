import { db, type DbOrTx } from '../../../infra/prisma/client';

const SETTINGS_ID = 1;

export const settingsRepository = {
  /** Garante a linha única e devolve com aprovadores padrão ordenados. */
  async get(tx: DbOrTx = db) {
    return tx.availabilitySettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
      include: { defaultApprovers: { include: { user: true }, orderBy: { position: 'asc' } } },
    });
  },
  async update(data: {
    minNoticeDays: number;
    maxSimultaneousPerProject: number;
    defaultApproverIds: string[];
  }) {
    return db.$transaction(async (tx) => {
      await tx.availabilitySettings.upsert({
        where: { id: SETTINGS_ID },
        create: {
          id: SETTINGS_ID,
          minNoticeDays: data.minNoticeDays,
          maxSimultaneousPerProject: data.maxSimultaneousPerProject,
        },
        update: {
          minNoticeDays: data.minNoticeDays,
          maxSimultaneousPerProject: data.maxSimultaneousPerProject,
        },
      });
      await tx.defaultApprover.deleteMany({ where: { settingsId: SETTINGS_ID } });
      if (data.defaultApproverIds.length > 0) {
        await tx.defaultApprover.createMany({
          data: data.defaultApproverIds.map((userId, position) => ({
            settingsId: SETTINGS_ID,
            userId,
            position,
          })),
        });
      }
      return settingsRepository.get(tx);
    });
  },
};
