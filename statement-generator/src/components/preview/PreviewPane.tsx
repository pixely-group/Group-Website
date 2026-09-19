import { useEffect, useRef, useState } from 'react';
import type { ComputedStatement, StatementData } from '../../types/statement';
import { PAGE, PX_PER_PT } from '../../document/layout';
import { StatementDocument } from '../../document/StatementDocument';
import type { ZoomMode } from './ExportBar';

interface PreviewPaneProps {
  data: StatementData;
  computed: ComputedStatement;
  zoom: ZoomMode;
  pageCount: number;
  onPageCountChange: (count: number) => void;
}

const PAGE_WIDTH_PX = PAGE.width * PX_PER_PT;
const PAGE_HEIGHT_PX = PAGE.height * PX_PER_PT;
const PAGE_GAP_PX = 24;
const PADDING_PX = 24;

/** Scrollable, scaled view of the real A4 pages. */
export function PreviewPane({ data, computed, zoom, pageCount, onPageCountChange }: PreviewPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const update = () => {
      const available = element.clientWidth - PADDING_PX * 2;
      setFitScale(Math.max(0.2, Math.min(2, available / PAGE_WIDTH_PX)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = zoom === 'fit' ? fitScale : Number(zoom);
  const totalHeight = pageCount > 0 ? pageCount * PAGE_HEIGHT_PX + (pageCount - 1) * PAGE_GAP_PX : PAGE_HEIGHT_PX;

  return (
    <div ref={containerRef} className="min-h-0 flex-1 overflow-auto bg-slate-200/70" style={{ padding: PADDING_PX }}>
      <div
        className="doc-preview-sizer mx-auto"
        style={{ width: PAGE_WIDTH_PX * scale, height: totalHeight * scale, position: 'relative' }}
      >
        <div
          className="doc doc-preview"
          style={{ width: PAGE_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <StatementDocument data={data} computed={computed} onPageCountChange={onPageCountChange} />
        </div>
      </div>
    </div>
  );
}
