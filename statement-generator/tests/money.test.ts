import { describe, expect, it } from 'vitest';
import { formatAmount, formatCurrency, parseAmount } from '../src/lib/money';
import { addDays, daysBetween, formatDateLong, formatDateShort, parseIsoDate } from '../src/lib/dates';

describe('money formatting', () => {
  it('formats table amounts with thousands separators and two decimals', () => {
    expect(formatAmount(1234.5)).toBe('1,234.50');
    expect(formatAmount(0)).toBe('0.00');
    expect(formatAmount(-98.7)).toBe('-98.70');
  });
  it('formats currency with a pound sign', () => {
    expect(formatCurrency(21350.71)).toBe('£21,350.71');
    expect(formatCurrency(-5)).toBe('-£5.00');
  });
});

describe('parseAmount', () => {
  it('accepts plain, comma and pound-prefixed input', () => {
    expect(parseAmount('1,234.56')).toEqual({ ok: true, value: 1234.56 });
    expect(parseAmount('£12')).toEqual({ ok: true, value: 12 });
    expect(parseAmount(' 0.5 ')).toEqual({ ok: true, value: 0.5 });
    expect(parseAmount('')).toEqual({ ok: true, value: null });
  });
  it('rejects invalid input with a message', () => {
    expect(parseAmount('abc').ok).toBe(false);
    expect(parseAmount('1.234').ok).toBe(false);
    expect(parseAmount('-5').ok).toBe(false);
    expect(parseAmount('-5', { allowNegative: true })).toEqual({ ok: true, value: -5 });
  });
});

describe('dates', () => {
  it('parses and formats ISO dates in statement style', () => {
    expect(parseIsoDate('2026-08-02')).toEqual({ year: 2026, month: 8, day: 2 });
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(formatDateLong('2026-08-02')).toBe('02 AUG 2026');
    expect(formatDateShort('2026-12-25')).toBe('25 DEC');
  });
  it('does day arithmetic without timezone drift', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(daysBetween('2026-08-01', '2026-08-31')).toBe(30);
  });
});
