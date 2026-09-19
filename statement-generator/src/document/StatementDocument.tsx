import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComputedStatement, StatementData } from '../types/statement';
import { FirstPageIntro } from './components/FirstPageIntro';
import { InfoPageA } from './components/InfoPageA';
import { InfoPageB } from './components/InfoPageB';
import { InterestInfo } from './components/InterestInfo';
import { MeasureLayer } from './components/MeasureLayer';
import { PageFrame } from './components/PageFrame';
import { TransactionTable } from './components/TransactionTable';
import { LAYOUT, pt } from './layout';
import { measurementsEqual, paginate, type PageSpec, type RowMeasurements } from './pagination';

interface StatementDocumentProps {
  data: StatementData;
  computed: ComputedStatement;
  /** Called whenever the page count changes (0 until the first measurement pass). */
  onPageCountChange?: ((count: number) => void) | undefined;
}

function PageBody({ spec, data, computed }: { spec: PageSpec; data: StatementData; computed: ComputedStatement }) {
  switch (spec.kind) {
    case 'transactions': {
      const top = spec.first ? LAYOUT.firstPageTableTop : LAYOUT.continuationTableTop;
      return (
        <>
          {spec.first && <FirstPageIntro data={data} printed={computed.printed} />}
          <div className="doc-body" style={{ top: pt(top) }}>
            <TransactionTable
              rows={computed.rows.slice(spec.start, spec.end)}
              broughtForward={spec.broughtForward}
              broughtForwardDate={spec.first ? data.periodStart : undefined}
            />
            {spec.withTail && <InterestInfo />}
          </div>
        </>
      );
    }
    case 'tail':
      return (
        <div className="doc-body" style={{ top: pt(LAYOUT.continuationTableTop) }}>
          <InterestInfo standalone />
        </div>
      );
    case 'info-a':
      return (
        <div className="doc-body" style={{ top: pt(LAYOUT.infoTop) }}>
          <InfoPageA />
        </div>
      );
    case 'info-b':
      return (
        <div className="doc-body" style={{ top: pt(LAYOUT.infoTop) }}>
          <InfoPageB />
        </div>
      );
  }
}

/**
 * Renders the complete multi-page sample document. Pagination is driven by real
 * row measurements from a hidden copy of the table, so the preview and the PDF
 * always agree on where pages break.
 */
export function StatementDocument({ data, computed, onPageCountChange }: StatementDocumentProps) {
  const [measurements, setMeasurements] = useState<RowMeasurements | null>(null);

  const handleMeasure = useCallback((next: RowMeasurements) => {
    setMeasurements((previous) => (measurementsEqual(previous, next) ? previous : next));
  }, []);

  const pages = useMemo(
    () => (measurements && measurements.rowEdges.length === computed.rows.length + 1
      ? paginate(computed.rows, measurements, data.previousBalance)
      : []),
    [measurements, computed.rows, data.previousBalance],
  );

  useEffect(() => {
    onPageCountChange?.(pages.length);
  }, [pages.length, onPageCountChange]);

  return (
    <>
      <MeasureLayer
        rows={computed.rows}
        previousBalance={data.previousBalance}
        periodStart={data.periodStart}
        onMeasure={handleMeasure}
      />
      {pages.map((spec, index) => (
        <PageFrame key={index} data={data} pageNumber={index + 1} pageCount={pages.length}>
          <PageBody spec={spec} data={data} computed={computed} />
        </PageFrame>
      ))}
    </>
  );
}
