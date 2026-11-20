import { MESSAGES, type CreateHolidayBody, type HolidayDto } from '@nacif/shared';
import { uniqueViolation } from '../../../db/errors';
import { AppError, NotFoundError } from '../../../infra/http/errors';
import { toHolidayDto } from './holiday.mapper';
import { holidaysRepository } from './holidays.repository';
import { recountService } from './recount.service';

export const holidaysService = {
  async list(): Promise<HolidayDto[]> {
    return (await holidaysRepository.list()).map(toHolidayDto);
  },

  /** Grava o feriado e reconta as comunicações que ainda não começaram. */
  async create(body: CreateHolidayBody, now: Date = new Date()): Promise<HolidayDto> {
    let row;
    try {
      row = await holidaysRepository.insert({ date: body.date, name: body.name });
    } catch (err) {
      if (uniqueViolation(err)?.startsWith('holidays.')) {
        throw new AppError(409, 'CONFLICT', MESSAGES.holidayExists);
      }
      throw err;
    }
    await recountService.recountUpcoming(now);
    return toHolidayDto(row);
  },

  async remove(id: string, now: Date = new Date()): Promise<void> {
    const removed = await holidaysRepository.remove(id);
    if (!removed) throw new NotFoundError('Feriado não encontrado.');
    await recountService.recountUpcoming(now);
  },
};
