import { describe, expect, it } from 'vitest';
import { computeStatement } from '../src/lib/calculations';
import { createSampleStatement } from '../src/lib/sampleData';
import type { StatementData, Transaction } from '../src/types/statement';

function tx(overrides: Partial<Transaction>): Transaction {
  return { id: overrides.id ?? Math.random().toString(36).slice(2), date: '2026-08-01', description: 'X', paidIn: null, withdrawn: null, balance: null, ...overrides };
}

function base(transactions: Transaction[], extra: Partial<StatementData> = {}): StatementData {
  return { ...createSampleStatement('small'), previousBalance: 1000, transactions, ...extra };
}

describe('computeStatement', () => {
  it('chains running balances: opening + paid in − withdrawn', () => {
    const result = computeStatement(base([tx({ withdrawn: 146.87 }), tx({ paidIn: 44.95 }), tx({ withdrawn: 0.05 })]));
    expect(result.rows.map((r) => r.effectiveBalance)).toEqual([853.13, 898.08, 898.03]);
    expect(result.computed).toEqual({ totalPaidIn: 44.95, totalWithdrawn: 146.92, newBalance: 898.03 });
    expect(result.printed).toEqual(result.computed);
  });

  it('avoids floating point drift by working in pence', () => {
    const rows = Array.from({ length: 300 }, () => tx({ withdrawn: 0.1 }));
    const result = computeStatement(base(rows, { previousBalance: 30 }));
    expect(result.computed.newBalance).toBe(0);
    expect(result.rows[299]?.effectiveBalance).toBe(0);
  });

  it('returns the opening balance as new balance when there are no transactions', () => {
    const result = computeStatement(base([], { previousBalance: 12.5 }));
    expect(result.rows).toEqual([]);
    expect(result.printed.newBalance).toBe(12.5);
  });

  it('ignores per-row overrides in automatic mode', () => {
    const result = computeStatement(base([tx({ withdrawn: 100, balance: 5 })], { calculationMode: 'auto' }));
    expect(result.rows[0]?.effectiveBalance).toBe(900);
  });

  it('honours per-row overrides in manual mode and chains from them', () => {
    const result = computeStatement(
      base([tx({ withdrawn: 100, balance: 5 }), tx({ paidIn: 10 })], { calculationMode: 'manual' }),
    );
    expect(result.rows[0]?.computedBalance).toBe(900);
    expect(result.rows[0]?.effectiveBalance).toBe(5);
    expect(result.rows[1]?.effectiveBalance).toBe(15);
    expect(result.printed.newBalance).toBe(15);
    // Pure arithmetic totals are still reported.
    expect(result.computed.newBalance).toBe(910);
  });

  it('uses manual summary overrides when provided, otherwise computed values', () => {
    const result = computeStatement(
      base([tx({ paidIn: 50 }), tx({ withdrawn: 20 })], {
        calculationMode: 'manual',
        manualSummary: { totalPaidIn: 999, totalWithdrawn: null, newBalance: null },
      }),
    );
    expect(result.printed.totalPaidIn).toBe(999);
    expect(result.printed.totalWithdrawn).toBe(20);
    expect(result.printed.newBalance).toBe(1030);
  });
});
