import { MESSAGES, type CreateHolidayBody, type HolidayDto } from '@nacif/shared';
import { uniqueViolation } from '../../../db/errors';
import { AppError, NotFoundError } from '../../../infra/http/errors';
import { toHolidayDto } from './holiday.mapper';
import { holidaysRepository } from './holidays.repository';

export const holidaysService = {
  async list(): Promise<HolidayDto[]> {
    return (await holidaysRepository.list()).map(toHolidayDto);
  },

  async create(body: CreateHolidayBody): Promise<HolidayDto> {
    try {
      return toHolidayDto(await holidaysRepository.insert({ date: body.date, name: body.name }));
    } catch (err) {
      if (uniqueViolation(err)?.startsWith('holidays.')) {
        throw new AppError(409, 'CONFLICT', MESSAGES.holidayExists);
      }
      throw err;
    }
  },

  async remove(id: string): Promise<void> {
    const removed = await holidaysRepository.remove(id);
    if (!removed) throw new NotFoundError('Feriado não encontrado.');
  },
};
