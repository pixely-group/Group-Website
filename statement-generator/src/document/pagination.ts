import type { ComputedTransaction } from '../types/statement';
import { LAYOUT, PX_PER_PT, type Layout } from './layout';

/** Heights measured (in CSS px) from a hidden render of the real table. */
export interface RowMeasurements {
  headerHeight: number;
  broughtForwardHeight: number;
  /**
   * rowEdges[i] = offset of the top of transaction row i from the top of row 0;
   * rowEdges[rows.length] = bottom edge of the last row. Using edges instead of
   * per-row heights avoids accumulating rounding error across a long page.
   */
  rowEdges: number[];
  /** Height of the interest/overdraft information block that follows the table. */
  tailHeight: number;
}

export interface TransactionsPage {
  kind: 'transactions';
  /** Row range [start, end) printed on this page. */
  start: number;
  end: number;
  /** Balance printed on the BROUGHT FORWARD row. */
  broughtForward: number;
  /** First page carries the address block, summary box and welcome band. */
  first: boolean;
  /** Whether the interest/overdraft information block fits under the table on this page. */
  withTail: boolean;
}

export type PageSpec =
  | TransactionsPage
  | { kind: 'tail' }
  | { kind: 'info-a' }
  | { kind: 'info-b' };

const toPx = (value: number): number => value * PX_PER_PT;

/**
 * Pack transaction rows into pages. Rows are never split; each page repeats the
 * table header and a BROUGHT FORWARD row. The information block after the table
 * stays on the last transaction page when it fits, otherwise it gets its own
 * page. Two fixed informational pages always follow.
 */
export function paginate(
  rows: ComputedTransaction[],
  measurements: RowMeasurements,
  previousBalance: number,
  layout: Layout = LAYOUT,
): PageSpec[] {
  const pages: PageSpec[] = [];
  const edges = measurements.rowEdges;
  const rowCount = rows.length;
  let cursor = 0;

  do {
    const first = pages.length === 0;
    const tableTop = first ? layout.firstPageTableTop : layout.continuationTableTop;
    const available =
      toPx(layout.tableBottomLimit - tableTop) - measurements.headerHeight - measurements.broughtForwardHeight;

    const start = cursor;
    const startEdge = edges[start] ?? 0;
    while (cursor < rowCount && (edges[cursor + 1] ?? 0) - startEdge <= available) {
      cursor += 1;
    }
    // A single row taller than a page can never fit; print it anyway rather than looping forever.
    if (cursor === start && cursor < rowCount) cursor += 1;

    const previousRow = start > 0 ? rows[start - 1] : undefined;
    pages.push({
      kind: 'transactions',
      start,
      end: cursor,
      broughtForward: previousRow ? previousRow.effectiveBalance : previousBalance,
      first,
      withTail: false,
    });
  } while (cursor < rowCount);

  const last = pages[pages.length - 1];
  if (last && last.kind === 'transactions') {
    const tableTop = last.first ? layout.firstPageTableTop : layout.continuationTableTop;
    const rowsHeight = (edges[last.end] ?? 0) - (edges[last.start] ?? 0);
    const used = toPx(tableTop) + measurements.headerHeight + measurements.broughtForwardHeight + rowsHeight;
    const fits = used + toPx(layout.tailGap) + measurements.tailHeight <= toPx(layout.tableBottomLimit);
    if (fits) {
      last.withTail = true;
    } else {
      pages.push({ kind: 'tail' });
    }
  }

  pages.push({ kind: 'info-a' }, { kind: 'info-b' });
  return pages;
}

export function measurementsEqual(a: RowMeasurements | null, b: RowMeasurements): boolean {
  if (!a) return false;
  if (a.headerHeight !== b.headerHeight || a.broughtForwardHeight !== b.broughtForwardHeight) return false;
  if (a.tailHeight !== b.tailHeight || a.rowEdges.length !== b.rowEdges.length) return false;
  for (let i = 0; i < a.rowEdges.length; i += 1) {
    if (a.rowEdges[i] !== b.rowEdges[i]) return false;
  }
  return true;
}
