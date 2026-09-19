const GBP_NUMBER = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Convert pounds to integer pence (avoids floating point drift in running totals). */
export function toPence(amount: number): number {
  return Math.round(amount * 100);
}

export function fromPence(pence: number): number {
  return pence / 100;
}

export function round2(amount: number): number {
  return fromPence(toPence(amount));
}

/** Table style: "1,234.56" or "-1,234.56" (no currency symbol). */
export function formatAmount(amount: number): string {
  const abs = GBP_NUMBER.format(Math.abs(amount));
  return toPence(amount) < 0 ? `-${abs}` : abs;
}

/** Summary style: "£1,234.56" or "-£1,234.56". */
export function formatCurrency(amount: number): string {
  const abs = GBP_NUMBER.format(Math.abs(amount));
  return toPence(amount) < 0 ? `-£${abs}` : `£${abs}`;
}

/** Plain 2dp string for editing inputs: "1234.56". */
export function toInputString(amount: number | null): string {
  return amount === null ? '' : round2(amount).toFixed(2);
}

export type ParseAmountResult =
  | { ok: true; value: number | null }
  | { ok: false; message: string };

const AMOUNT_PATTERN = /^-?(\d+(\.\d{0,2})?|\.\d{1,2})$/;

/**
 * Parse user-typed money. Accepts "1,234.56", "£12", "12.5", "" (= null).
 * Rejects anything that is not a plain decimal with at most two places.
 */
export function parseAmount(raw: string, options: { allowNegative?: boolean } = {}): ParseAmountResult {
  const text = raw.trim().replace(/[£,\s]/g, '');
  if (text === '') return { ok: true, value: null };
  if (/^-?\d*\.\d{3,}$/.test(text)) return { ok: false, message: 'Use at most 2 decimal places' };
  if (!AMOUNT_PATTERN.test(text)) return { ok: false, message: 'Enter a valid amount, e.g. 1234.56' };
  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, message: 'Enter a valid amount' };
  if (!options.allowNegative && value < 0) return { ok: false, message: 'Amount cannot be negative' };
  return { ok: true, value: round2(value) };
}
