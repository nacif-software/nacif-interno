import { z } from 'zod';
import { JUSTIFICATION_MAX_CHARS, LEDGER_NOTE_MIN_CHARS } from '../constants';
import { isoDateSchema } from '../date/iso-date';
import { ledgerEntryTypeSchema } from '../enums/ledger-entry-type';
import { MESSAGES } from '../labels/pt-br';
import { personRefSchema } from './common';

/** Linha do extrato: lançamento do livro ou comunicação aprovada (débito). */
export const balanceEntryKindSchema = z.enum([...ledgerEntryTypeSchema.options, 'COMMUNICATION']);
export type BalanceEntryKind = z.infer<typeof balanceEntryKindSchema>;

export const balanceEntryDtoSchema = z.object({
  id: z.string(),
  kind: balanceEntryKindSchema,
  date: isoDateSchema,
  /** Com sinal: créditos positivos, vendas e comunicações negativos. */
  days: z.number().int(),
  note: z.string().nullable(),
  createdBy: personRefSchema.nullable(),
  communication: z
    .object({ id: z.string(), code: z.string(), startDate: isoDateSchema, endDate: isoDateSchema })
    .nullable(),
  runningBalance: z.number().int(),
});
export type BalanceEntryDto = z.infer<typeof balanceEntryDtoSchema>;

export const balanceDtoSchema = z.object({
  user: personRefSchema,
  creditBaseDate: isoDateSchema.nullable(),
  balance: z.number().int(),
  credits: z.number().int(),
  sales: z.number().int(),
  deducted: z.number().int(),
  entries: z.array(balanceEntryDtoSchema),
});
export type BalanceDto = z.infer<typeof balanceDtoSchema>;

export const balanceOverviewItemSchema = z.object({
  user: personRefSchema.extend({ initials: z.string(), active: z.boolean() }),
  creditBaseDate: isoDateSchema.nullable(),
  balance: z.number().int(),
  lastEntryDate: isoDateSchema.nullable(),
});
export type BalanceOverviewItem = z.infer<typeof balanceOverviewItemSchema>;

export const createLedgerEntryBodySchema = z.object({
  type: z.enum(['GRANT', 'SALE']),
  days: z.coerce.number().int().min(1).max(366),
  referenceDate: isoDateSchema,
  note: z
    .string()
    .trim()
    .min(LEDGER_NOTE_MIN_CHARS, { error: MESSAGES.ledgerNoteTooShort })
    .max(JUSTIFICATION_MAX_CHARS),
});
export type CreateLedgerEntryBody = z.infer<typeof createLedgerEntryBodySchema>;

export const accrualRunResultSchema = z.object({ created: z.number().int() });
export type AccrualRunResult = z.infer<typeof accrualRunResultSchema>;
