import { describe, expect, it } from 'vitest';
import { LAYOUT, PX_PER_PT } from '../src/document/layout';
import { paginate, type RowMeasurements, type TransactionsPage } from '../src/document/pagination';
import type { ComputedTransaction } from '../src/types/statement';

const ROW_PX = 12.4 * PX_PER_PT;
const HEADER_PX = 18 * PX_PER_PT;
const TAIL_PX = 256 * PX_PER_PT;

function rows(count: number, rowHeightPx = ROW_PX): { rows: ComputedTransaction[]; measurements: RowMeasurements } {
  const list: ComputedTransaction[] = Array.from({ length: count }, (_, i) => ({
    id: String(i),
    date: '2026-08-01',
    description: `row ${i}`,
    paidIn: null,
    withdrawn: 1,
    balance: null,
    computedBalance: 1000 - (i + 1),
    effectiveBalance: 1000 - (i + 1),
  }));
  const rowEdges = Array.from({ length: count + 1 }, (_, i) => i * rowHeightPx);
  return {
    rows: list,
    measurements: { headerHeight: HEADER_PX, broughtForwardHeight: ROW_PX, rowEdges, tailHeight: TAIL_PX },
  };
}

function transactionPages(pages: ReturnType<typeof paginate>): TransactionsPage[] {
  return pages.filter((p): p is TransactionsPage => p.kind === 'transactions');
}

describe('paginate', () => {
  it('puts a short statement on one transaction page with the info block and two info pages', () => {
    const { rows: list, measurements } = rows(10);
    const pages = paginate(list, measurements, 1000);
    expect(pages.map((p) => p.kind)).toEqual(['transactions', 'info-a', 'info-b']);
    const first = pages[0] as TransactionsPage;
    expect(first).toMatchObject({ start: 0, end: 10, first: true, withTail: true, broughtForward: 1000 });
  });

  it('handles an empty transaction list', () => {
    const { rows: list, measurements } = rows(0);
    const pages = paginate(list, measurements, 42);
    expect(pages[0]).toMatchObject({ kind: 'transactions', start: 0, end: 0, broughtForward: 42, withTail: true });
    expect(pages).toHaveLength(3);
  });

  it('flows long statements over several pages without splitting rows and chains brought-forward balances', () => {
    const { rows: list, measurements } = rows(200);
    const pages = paginate(list, measurements, 1000);
    const txPages = transactionPages(pages);
    expect(txPages.length).toBeGreaterThan(2);

    // Contiguous coverage of every row.
    expect(txPages[0]?.start).toBe(0);
    for (let i = 1; i < txPages.length; i += 1) {
      expect(txPages[i]?.start).toBe(txPages[i - 1]?.end);
      expect(txPages[i]?.first).toBe(false);
      expect(txPages[i]?.broughtForward).toBe(list[(txPages[i]?.start ?? 0) - 1]?.effectiveBalance);
    }
    expect(txPages[txPages.length - 1]?.end).toBe(200);

    // The first page has less room (address/summary block) than a continuation page.
    const firstCount = (txPages[0]?.end ?? 0) - (txPages[0]?.start ?? 0);
    const secondCount = (txPages[1]?.end ?? 0) - (txPages[1]?.start ?? 0);
    expect(secondCount).toBeGreaterThan(firstCount);

    // Every page's rows fit inside its available area.
    for (const page of txPages) {
      const top = page.first ? LAYOUT.firstPageTableTop : LAYOUT.continuationTableTop;
      const available = (LAYOUT.tableBottomLimit - top) * PX_PER_PT - HEADER_PX - ROW_PX;
      expect((page.end - page.start) * ROW_PX).toBeLessThanOrEqual(available);
    }
  });

  it('moves the information block to its own page when the last page is full', () => {
    // Fill the first page exactly so the tail cannot fit underneath.
    const available = (LAYOUT.tableBottomLimit - LAYOUT.firstPageTableTop) * PX_PER_PT - HEADER_PX - ROW_PX;
    const count = Math.floor(available / ROW_PX);
    const { rows: list, measurements } = rows(count);
    const pages = paginate(list, measurements, 0);
    expect(pages.map((p) => p.kind)).toEqual(['transactions', 'tail', 'info-a', 'info-b']);
    expect((pages[0] as TransactionsPage).withTail).toBe(false);
  });

  it('never loops on a row taller than a page', () => {
    const { rows: list, measurements } = rows(1, 5000);
    const pages = paginate(list, measurements, 0);
    expect(pages[0]).toMatchObject({ kind: 'transactions', start: 0, end: 1 });
  });
});
