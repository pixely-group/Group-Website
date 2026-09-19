const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export function parseIsoDate(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

export function isValidIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toIsoDate(parts: DateParts): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

/** "02 AUG 2026" — used for the first row and the summary box. */
export function formatDateLong(value: string): string {
  const parts = parseIsoDate(value);
  if (!parts) return value;
  return `${pad2(parts.day)} ${MONTHS[parts.month - 1] ?? '???'} ${parts.year}`;
}

/** "02 AUG" — used for subsequent transaction rows. */
export function formatDateShort(value: string): string {
  const parts = parseIsoDate(value);
  if (!parts) return value;
  return `${pad2(parts.day)} ${MONTHS[parts.month - 1] ?? '???'}`;
}

/** "02/08/26" — used inside generated Faster Payment style references. */
export function formatDateNumeric(value: string): string {
  const parts = parseIsoDate(value);
  if (!parts) return value;
  return `${pad2(parts.day)}/${pad2(parts.month)}/${String(parts.year).slice(-2)}`;
}

/** "02AUG26" — used inside generated card transaction descriptions. */
export function formatDateCompact(value: string): string {
  const parts = parseIsoDate(value);
  if (!parts) return value;
  return `${pad2(parts.day)}${MONTHS[parts.month - 1] ?? '???'}${String(parts.year).slice(-2)}`;
}

export function addDays(value: string, days: number): string {
  const parts = parseIsoDate(value);
  if (!parts) return value;
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return toIsoDate({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
}

export function daysBetween(start: string, end: string): number {
  const a = parseIsoDate(start);
  const b = parseIsoDate(end);
  if (!a || !b) return 0;
  const ms = Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day);
  return Math.round(ms / 86_400_000);
}

/** Valid ISO dates compare correctly as strings. */
export function compareIsoDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
