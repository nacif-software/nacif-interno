import { isApproverRole, type SettingsDto, type UpdateSettingsBody } from '@nacif/shared';
import { inArray } from 'drizzle-orm';
import { db } from '../../../db/client';
import { users } from '../../../db/schema';
import type { SettingsRow } from '../../../db/types';
import { AppError } from '../../../infra/http/errors';
import { settingsRepository } from './settings.repository';

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
      const found = await db().query.users.findMany({ where: inArray(users.id, ids) });
      const invalid = ids.filter((id) => {
        const u = found.find((x) => x.id === id);
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
