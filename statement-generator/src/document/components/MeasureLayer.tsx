import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ComputedTransaction } from '../../types/statement';
import type { RowMeasurements } from '../pagination';
import { InterestInfo } from './InterestInfo';
import { TransactionTable } from './TransactionTable';

interface MeasureLayerProps {
  rows: ComputedTransaction[];
  previousBalance: number;
  periodStart: string;
  onMeasure: (measurements: RowMeasurements) => void;
}

/**
 * Renders the full transaction table once, hidden and at the real document
 * width, and reports the exact layout height of every row. The pagination
 * engine uses these measurements so a row is never split across pages.
 *
 * Portaled to <body> so it is never inside the scaled preview transform.
 */
export function MeasureLayer({ rows, previousBalance, periodStart, onMeasure }: MeasureLayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const head = root.querySelector('thead');
      const broughtForward = root.querySelector<HTMLElement>('tr[data-bf-row]');
      const tail = root.querySelector<HTMLElement>('[data-tail]');
      const rowElements = Array.from(root.querySelectorAll<HTMLElement>('tr[data-row-index]'));
      if (!head || !broughtForward || !tail) return;

      const rowEdges: number[] = [];
      const firstRow = rowElements[0];
      const base = firstRow ? firstRow.getBoundingClientRect().top : 0;
      for (const element of rowElements) {
        rowEdges.push(element.getBoundingClientRect().top - base);
      }
      const lastRow = rowElements[rowElements.length - 1];
      rowEdges.push(lastRow ? lastRow.getBoundingClientRect().bottom - base : 0);

      onMeasure({
        headerHeight: head.getBoundingClientRect().height,
        broughtForwardHeight: broughtForward.getBoundingClientRect().height,
        rowEdges,
        tailHeight: tail.getBoundingClientRect().height,
      });
    };

    measure();
    // Re-measure once fonts finish loading in case metrics change.
    let cancelled = false;
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      }).catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [rows, previousBalance, periodStart, onMeasure]);

  return createPortal(
    <div ref={rootRef} className="doc doc-measure" aria-hidden="true">
      <TransactionTable rows={rows} broughtForward={previousBalance} broughtForwardDate={periodStart} />
      <InterestInfo />
    </div>,
    document.body,
  );
}
