import type { IsoDate } from '../date/iso-date';
import type { LedgerEntryType } from '../enums/ledger-entry-type';

/** Dias com sinal: créditos somam, vendas subtraem. */
export function signedLedgerDays(type: LedgerEntryType, days: number): number {
  return type === 'SALE' ? -days : days;
}

export interface StatementInput {
  date: IsoDate;
  /** Com sinal (créditos positivos, débitos negativos). */
  days: number;
  /** Desempate para lançamentos do mesmo dia (ex.: id). */
  order: string;
}

/**
 * Saldo acumulado linha a linha, em ordem cronológica, para montar um extrato.
 * Devolve na ordem de exibição (mais recente primeiro), cada item com `runningBalance`.
 */
export function withRunningBalance<T extends StatementInput>(
  items: T[],
): (T & { runningBalance: number })[] {
  const ascending = [...items].sort(
    (a, b) => a.date.localeCompare(b.date) || a.order.localeCompare(b.order),
  );
  let running = 0;
  const result = ascending.map((item) => {
    running += item.days;
    return { ...item, runningBalance: running };
  });
  return result.reverse();
}

/** Saldo de uma pessoa depois de aprovar uma comunicação com `deductedDays`. */
export function balanceAfter(balance: number, deductedDays: number): number {
  return balance - deductedDays;
}
