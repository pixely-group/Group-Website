import { useCallback, useMemo, useState } from 'react';
import { AccountSection } from './components/editor/AccountSection';
import { CalculationSection } from './components/editor/CalculationSection';
import { StatementSection } from './components/editor/StatementSection';
import { TransactionsEditor } from './components/editor/TransactionsEditor';
import { ExportBar, type ExportStatus, type ZoomMode } from './components/preview/ExportBar';
import { PreviewPane } from './components/preview/PreviewPane';
import { TopBar } from './components/TopBar';
import { exportStatementPdf } from './export/exportPdf';
import { computeStatement } from './lib/calculations';
import { validateStatement } from './lib/validation';
import { useStatementStore } from './state/useStatementStore';

export default function App() {
  const [data, dispatch] = useStatementStore();
  const computed = useMemo(() => computeStatement(data), [data]);
  const issues = useMemo(() => validateStatement(data), [data]);

  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState<ZoomMode>('fit');
  const [pane, setPane] = useState<'editor' | 'preview'>('editor');
  const [status, setStatus] = useState<ExportStatus>({ busy: false, tone: 'idle', message: null });

  const handleExport = useCallback(async () => {
    setStatus({ busy: true, tone: 'idle', message: 'Rendering PDF in headless Chromium…' });
    const result = await exportStatementPdf(data);
    setStatus({ busy: false, tone: result.ok ? 'success' : 'error', message: result.message });
  }, [data]);

  const handlePrint = useCallback(() => {
    // The print route reads the persisted statement and calls window.print() once rendered.
    window.open('/print?autoprint=1', '_blank', 'noopener');
  }, []);

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900">
      <TopBar pane={pane} onPaneChange={setPane} dispatch={dispatch} />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[520px_minmax(0,1fr)] xl:grid-cols-[560px_minmax(0,1fr)]">
        <aside
          className={`app-chrome min-h-0 overflow-y-auto border-r border-slate-200 bg-slate-50 ${pane === 'editor' ? 'block' : 'hidden'} lg:block`}
        >
          <div className="flex flex-col gap-4 p-4">
            <AccountSection data={data} issues={issues} dispatch={dispatch} />
            <StatementSection data={data} issues={issues} dispatch={dispatch} />
            <CalculationSection data={data} computed={computed} issues={issues} pageCount={pageCount} dispatch={dispatch} />
            <TransactionsEditor data={data} computed={computed} issues={issues} dispatch={dispatch} />
          </div>
        </aside>
        <main className={`flex min-h-0 flex-col ${pane === 'preview' ? 'flex' : 'hidden'} lg:flex`}>
          <ExportBar
            pageCount={pageCount}
            issues={issues}
            zoom={zoom}
            status={status}
            onZoomChange={setZoom}
            onExport={() => void handleExport()}
            onPrint={handlePrint}
          />
          <PreviewPane data={data} computed={computed} zoom={zoom} pageCount={pageCount} onPageCountChange={setPageCount} />
        </main>
      </div>
    </div>
  );
}
