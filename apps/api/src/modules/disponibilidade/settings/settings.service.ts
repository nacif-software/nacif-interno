import { isApproverRole, type SettingsDto, type UpdateSettingsBody } from '@nacif/shared';
import { AppError } from '../../../infra/http/errors';
import { db } from '../../../infra/prisma/client';
import { settingsRepository } from './settings.repository';

type SettingsRow = Awaited<ReturnType<typeof settingsRepository.get>>;

export function toSettingsDto(row: SettingsRow): SettingsDto {
  return {
    minNoticeDays: row.minNoticeDays,
    maxSimultaneousPerProject: row.maxSimultaneousPerProject,
    defaultApprovers: row.defaultApprovers.map((d) => ({ id: d.user.id, name: d.user.name })),
  };
}

export const settingsService = {
  async get(): Promise<SettingsDto> {
    return toSettingsDto(await settingsRepository.get());
  },

  async update(body: UpdateSettingsBody): Promise<SettingsDto> {
    const ids = [...new Set(body.defaultApproverIds)];
    if (ids.length > 0) {
      const users = await db.user.findMany({ where: { id: { in: ids } } });
      const invalid = ids.filter((id) => {
        const u = users.find((x) => x.id === id);
        return !u || !u.active || !isApproverRole(u.role);
      });
      if (invalid.length > 0) {
        throw new AppError(
          422,
          'VALIDATION_ERROR',
          'Aprovadores padrão precisam ser aprovadores ou administradores ativos.',
          { invalid },
        );
      }
    }
    return toSettingsDto(await settingsRepository.update({ ...body, defaultApproverIds: ids }));
  },
};
