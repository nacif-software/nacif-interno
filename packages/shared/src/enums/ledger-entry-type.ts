import { z } from 'zod';

/** Lançamentos do saldo de dias: crédito anual automático, crédito manual e venda de dias. */
export const LEDGER_ENTRY_TYPES = ['ACCRUAL', 'GRANT', 'SALE'] as const;
export const ledgerEntryTypeSchema = z.enum(LEDGER_ENTRY_TYPES);
export type LedgerEntryType = z.infer<typeof ledgerEntryTypeSchema>;
