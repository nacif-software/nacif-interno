import { APP_TIMEZONE } from '../constants';
import { parseIsoDate, type IsoDate, type IsoMonth } from './iso-date';

export const MONTH_ABBR = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;
export const MONTH_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

/** Iniciais dos dias da semana começando no domingo, como no design. */
export const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

/** Separador de intervalo usado em toda a UI (en-dash). */
export const RANGE_SEPARATOR = ' – ';

function split(iso: IsoDate): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return { y, m, d };
}

function dd(d: number): string {
  return String(d).padStart(2, '0');
}

function abbr(m: number): string {
  return MONTH_ABBR[m - 1] ?? '';
}

/** '2026-10-05' → '05 out' */
export function formatDayMonth(iso: IsoDate): string {
  const { m, d } = split(iso);
  return `${dd(d)} ${abbr(m)}`;
}

/** '2026-10-05' → '05 out 2026' */
export function formatDate(iso: IsoDate): string {
  const { y, m, d } = split(iso);
  return `${dd(d)} ${abbr(m)} ${y}`;
}

/**
 * Intervalo como no design:
 * mesmo mês → '05 – 09 out 2026'; meses diferentes → '28 out – 03 nov 2026';
 * anos diferentes → '28 dez 2026 – 03 jan 2027'; um dia → '05 out 2026'.
 * `withYear: false` omite o ano (versão mobile): '14 – 18 set'.
 */
export function formatDateRange(
  startDate: IsoDate,
  endDate: IsoDate,
  options: { withYear?: boolean } = {},
): string {
  const withYear = options.withYear ?? true;
  const s = split(startDate);
  const e = split(endDate);
  const yearSuffix = withYear ? ` ${e.y}` : '';

  if (startDate === endDate) {
    return `${dd(s.d)} ${abbr(s.m)}${yearSuffix}`;
  }
  if (s.y === e.y && s.m === e.m) {
    return `${dd(s.d)}${RANGE_SEPARATOR}${dd(e.d)} ${abbr(e.m)}${yearSuffix}`;
  }
  if (s.y === e.y) {
    return `${dd(s.d)} ${abbr(s.m)}${RANGE_SEPARATOR}${dd(e.d)} ${abbr(e.m)}${yearSuffix}`;
  }
  const startYear = withYear ? ` ${s.y}` : '';
  return `${dd(s.d)} ${abbr(s.m)}${startYear}${RANGE_SEPARATOR}${dd(e.d)} ${abbr(e.m)}${yearSuffix}`;
}

/** Forma compacta usada em notas de conflito: '06–08 out' ou '28 out–03 nov'. */
export function formatCompactRange(startDate: IsoDate, endDate: IsoDate): string {
  const s = split(startDate);
  const e = split(endDate);
  if (startDate === endDate) return `${dd(s.d)} ${abbr(s.m)}`;
  if (s.m === e.m && s.y === e.y) return `${dd(s.d)}–${dd(e.d)} ${abbr(e.m)}`;
  return `${dd(s.d)} ${abbr(s.m)}–${dd(e.d)} ${abbr(e.m)}`;
}

/** Forma em prosa usada no alerta de conflito: '06 a 08 out'. */
export function formatProseRange(startDate: IsoDate, endDate: IsoDate): string {
  const s = split(startDate);
  const e = split(endDate);
  if (startDate === endDate) return `${dd(s.d)} ${abbr(s.m)}`;
  if (s.m === e.m && s.y === e.y) return `${dd(s.d)} a ${dd(e.d)} ${abbr(e.m)}`;
  return `${dd(s.d)} ${abbr(s.m)} a ${dd(e.d)} ${abbr(e.m)}`;
}

/** '2026-10' → 'Outubro 2026' */
export function formatMonthTitle(month: IsoMonth): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return `${MONTH_FULL[m - 1] ?? ''} ${y}`;
}

/** Intervalo de meses para o chip de período: 'Set – out 2026'. */
export function formatMonthRange(from: IsoMonth, to: IsoMonth): string {
  const [fy, fm] = from.split('-').map(Number) as [number, number];
  const [ty, tm] = to.split('-').map(Number) as [number, number];
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (from === to) return `${cap(abbr(fm))} ${fy}`;
  if (fy === ty) return `${cap(abbr(fm))}${RANGE_SEPARATOR}${abbr(tm)} ${ty}`;
  return `${cap(abbr(fm))} ${fy}${RANGE_SEPARATOR}${abbr(tm)} ${ty}`;
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    iso: `${get('year')}-${get('month')}-${get('day')}`,
    hour: get('hour') === '24' ? '00' : get('hour'),
    minute: get('minute'),
  };
}

/** Instante (ISO ou Date) → '21 ago 2026, 09:12' no fuso da aplicação. */
export function formatTimestamp(value: string | Date, timeZone: string = APP_TIMEZONE): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const { iso, hour, minute } = zonedParts(date, timeZone);
  return `${formatDate(iso)}, ${hour}:${minute}`;
}

/** Instante → data de calendário no fuso da aplicação ('2026-08-21'). */
export function toZonedIsoDate(value: string | Date, timeZone: string = APP_TIMEZONE): IsoDate {
  const date = typeof value === 'string' ? new Date(value) : value;
  return zonedParts(date, timeZone).iso;
}

/** Instante → 'enviada 02 ago' */
export function formatSentOn(value: string | Date, timeZone: string = APP_TIMEZONE): string {
  return `enviada ${formatDayMonth(toZonedIsoDate(value, timeZone))}`;
}

/** Instante → '20 ago 2026' (coluna "Enviada em"). */
export function formatSentDate(value: string | Date, timeZone: string = APP_TIMEZONE): string {
  return formatDate(toZonedIsoDate(value, timeZone));
}

/** 5 → '5 dias úteis'; 1 → '1 dia útil' */
export function formatBusinessDays(n: number): string {
  return n === 1 ? '1 dia útil' : `${n} dias úteis`;
}

/** 5 → '5 dias'; 1 → '1 dia' */
export function formatDays(n: number): string {
  return n === 1 ? '1 dia' : `${n} dias`;
}

/** Só para garantir que parseIsoDate é reexportado com o restante. */
export { parseIsoDate };
