import { MESSAGES, type CreateHolidayBody, type HolidayDto } from '@nacif/shared';
import { batchAll } from '../../../db/client';
import { uniqueViolation } from '../../../db/errors';
import { AppError, NotFoundError } from '../../../infra/http/errors';
import { toHolidayDto } from './holiday.mapper';
import { holidaysRepository } from './holidays.repository';
import { recountService } from './recount.service';

/**
 * A recontagem do batch usa o calendário lido antes dele; se outra mudança entrou no meio, uma
 * segunda passada contra o calendário já gravado corrige (idempotente: sem diferença, não escreve).
 */
function reconcile(now: Date) {
  return recountService.recountUpcoming(now);
}

export const holidaysService = {
  async list(): Promise<HolidayDto[]> {
    return (await holidaysRepository.list()).map(toHolidayDto);
  },

  /** Grava o feriado e reconta as comunicações afetadas num único batch (tudo ou nada). */
  async create(body: CreateHolidayBody, now: Date = new Date()): Promise<HolidayDto> {
    const id = crypto.randomUUID();
    const calendar = new Set(await holidaysRepository.dateSet()).add(body.date);
    const recount = await recountService.statements(calendar, now);
    try {
      await batchAll([
        holidaysRepository.insert({ id, date: body.date, name: body.name, createdAt: now }),
        ...recount.statements,
      ]);
    } catch (err) {
      if (uniqueViolation(err)?.startsWith('holidays.')) {
        throw new AppError(409, 'CONFLICT', MESSAGES.holidayExists);
      }
      throw err;
    }
    await reconcile(now);
    return toHolidayDto({ id, date: body.date, name: body.name, createdAt: now });
  },

  /** Remove o feriado e reconta as comunicações afetadas num único batch. */
  async remove(id: string, now: Date = new Date()): Promise<void> {
    const holiday = await holidaysRepository.findById(id);
    if (!holiday) throw new NotFoundError('Feriado não encontrado.');
    const calendar = new Set(await holidaysRepository.dateSet());
    calendar.delete(holiday.date);
    const recount = await recountService.statements(calendar, now);
    await batchAll([holidaysRepository.remove(id), ...recount.statements]);
    await reconcile(now);
  },
};
