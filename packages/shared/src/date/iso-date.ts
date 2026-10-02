import { z } from 'zod';

/** Data de calendário no formato YYYY-MM-DD, sem fuso. */
export type IsoDate = string;
/** Mês no formato YYYY-MM. */
export type IsoMonth = string;

export const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const ISO_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export const isoDateSchema = z
  .string()
  .regex(ISO_DATE_RE, { error: 'Data inválida. Use o formato AAAA-MM-DD.' })
  .refine((s) => isValidIsoDate(s), { error: 'Data inválida.' });

export const isoMonthSchema = z
  .string()
  .regex(ISO_MONTH_RE, { error: 'Mês inválido. Use o formato AAAA-MM.' });

export function isValidIsoDate(s: string): boolean {
  if (!ISO_DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Converte YYYY-MM-DD em Date UTC à meia-noite (só para aritmética de calendário). */
export function parseIsoDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIsoDate(date: Date): IsoDate {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

/** Comparação lexicográfica funciona para YYYY-MM-DD. */
export function compareIsoDates(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function maxIsoDate(a: IsoDate, b: IsoDate): IsoDate {
  return a > b ? a : b;
}

export function minIsoDate(a: IsoDate, b: IsoDate): IsoDate {
  return a < b ? a : b;
}

export function isoDateYear(iso: IsoDate): number {
  return Number(iso.slice(0, 4));
}

export function isoDateMonth(iso: IsoDate): IsoMonth {
  return iso.slice(0, 7);
}

/** Dia da semana: 0 = domingo … 6 = sábado. */
export function isoDayOfWeek(iso: IsoDate): number {
  return parseIsoDate(iso).getUTCDay();
}

export function monthStart(month: IsoMonth): IsoDate {
  return `${month}-01`;
}

export function monthEnd(month: IsoMonth): IsoDate {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${String(last).padStart(2, '0')}`;
}

export function daysInMonth(month: IsoMonth): number {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addMonths(month: IsoMonth, delta: number): IsoMonth {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Data de "hoje" no fuso informado, como YYYY-MM-DD.
 * `now` é injetável para testes.
 */
export function todayIso(timeZone: string, now: Date = new Date()): IsoDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
