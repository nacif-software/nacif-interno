import {
  getInitials,
  signedLedgerDays,
  withRunningBalance,
  type BalanceDto,
  type BalanceEntryDto,
  type BalanceOverviewItem,
  type CreateLedgerEntryBody,
} from '@nacif/shared';
import type { AuthenticatedUser } from '../../../infra/http/context';
import { NotFoundError } from '../../../infra/http/errors';
import { usersRepository } from '../../core/users/users.repository';
import { balanceRepository } from './balance.repository';

type StatementLine = Omit<BalanceEntryDto, 'runningBalance'> & { order: string };

export const balanceService = {
  /** Extrato da pessoa: lançamentos e comunicações aprovadas, com saldo acumulado. */
  async statement(userId: string): Promise<BalanceDto> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('Pessoa não encontrada.');
    const [entries, approved] = await Promise.all([
      balanceRepository.entriesOf(userId),
      balanceRepository.approvedOf(userId),
    ]);
    const lines: StatementLine[] = [
      ...entries.map((e) => ({
        id: e.id,
        kind: e.type,
        date: e.referenceDate,
        days: signedLedgerDays(e.type, e.days),
        note: e.note,
        createdBy: e.createdBy ? { id: e.createdBy.id, name: e.createdBy.name } : null,
        communication: null,
        order: e.createdAt.toISOString(),
      })),
      ...approved.map((c) => ({
        id: `communication:${c.id}`,
        kind: 'COMMUNICATION' as const,
        date: c.startDate,
        days: -(c.deductedDays ?? c.businessDays),
        note: null,
        createdBy: null,
        communication: { id: c.id, code: c.code, startDate: c.startDate, endDate: c.endDate },
        order: c.submittedAt.toISOString(),
      })),
    ];
    const statement = withRunningBalance(lines).map(({ order: _order, ...line }) => line);
    const credits = lines.filter((l) => l.days > 0).reduce((t, l) => t + l.days, 0);
    const sales = lines.filter((l) => l.kind === 'SALE').reduce((t, l) => t - l.days, 0);
    const deducted = lines
      .filter((l) => l.kind === 'COMMUNICATION')
      .reduce((t, l) => t - l.days, 0);
    return {
      user: { id: user.id, name: user.name },
      creditBaseDate: user.creditBaseDate ?? null,
      balance: credits - sales - deducted,
      credits,
      sales,
      deducted,
      entries: statement,
    };
  },

  async overview(): Promise<BalanceOverviewItem[]> {
    const rows = await balanceRepository.overview();
    return rows.map((r) => ({
      user: {
        id: r.user.id,
        name: r.user.name,
        initials: getInitials(r.user.name),
        active: r.user.active,
      },
      creditBaseDate: r.user.creditBaseDate ?? null,
      balance: r.balance,
      lastEntryDate: r.lastEntryDate,
    }));
  },

  /** Crédito manual ou venda de dias, lançados por um administrador. */
  async createEntry(
    actor: AuthenticatedUser,
    userId: string,
    body: CreateLedgerEntryBody,
  ): Promise<BalanceDto> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('Pessoa não encontrada.');
    await balanceRepository.insert({
      userId,
      type: body.type,
      days: body.days,
      referenceDate: body.referenceDate,
      referenceYear: null,
      note: body.note,
      createdById: actor.id,
    });
    return this.statement(userId);
  },
};
