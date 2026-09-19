import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StatementData } from '../types/statement';
import { StatementDocument } from '../document/StatementDocument';
import { computeStatement } from '../lib/calculations';
import { createSampleStatement } from '../lib/sampleData';
import { isStatementData } from '../lib/schema';
import { loadStoredStatement } from '../state/useStatementStore';

declare global {
  interface Window {
    /** Injected by the PDF export service before the print route loads. */
    __STATEMENT_DATA__?: unknown;
  }
}

function loadPrintData(): StatementData {
  const injected = window.__STATEMENT_DATA__;
  if (isStatementData(injected)) return injected;
  return loadStoredStatement() ?? createSampleStatement('small');
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Document-only route used by the PDF service and by the browser print
 * fallback. Sets `data-print-ready` on <body> once pagination has settled.
 */
export function PrintApp() {
  const data = useMemo(loadPrintData, []);
  const computed = useMemo(() => computeStatement(data), [data]);
  const [pageCount, setPageCount] = useState(0);
  const handlePageCount = useCallback((count: number) => setPageCount(count), []);

  useEffect(() => {
    if (pageCount === 0) return;
    let cancelled = false;
    (async () => {
      await document.fonts.ready;
      await nextFrame();
      await nextFrame();
      if (cancelled) return;
      document.body.dataset.printReady = 'true';
      if (new URLSearchParams(window.location.search).get('autoprint') === '1') {
        window.print();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageCount]);

  return (
    <div className="doc doc-print">
      <StatementDocument data={data} computed={computed} onPageCountChange={handlePageCount} />
    </div>
  );
}
