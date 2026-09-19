import { countIssues, type ValidationIssue } from '../../lib/validation';
import { Button } from '../ui/Button';

export type ZoomMode = 'fit' | '0.5' | '0.75' | '1' | '1.25';

export interface ExportStatus {
  busy: boolean;
  tone: 'idle' | 'success' | 'error';
  message: string | null;
}

interface ExportBarProps {
  pageCount: number;
  issues: ValidationIssue[];
  zoom: ZoomMode;
  status: ExportStatus;
  onZoomChange: (zoom: ZoomMode) => void;
  onExport: () => void;
  onPrint: () => void;
}

export function ExportBar({ pageCount, issues, zoom, status, onZoomChange, onExport, onPrint }: ExportBarProps) {
  const { errors, warnings } = countIssues(issues);
  const blocked = errors > 0;

  return (
    <div className="app-chrome sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-900">Preview</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {pageCount > 0 ? `${pageCount} page${pageCount === 1 ? '' : 's'}` : 'measuring…'}
          </span>
          {errors > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {errors} error{errors === 1 ? '' : 's'}
            </span>
          )}
          {warnings > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {warnings} warning{warnings === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            Zoom
            <select
              value={zoom}
              onChange={(event) => onZoomChange(event.target.value as ZoomMode)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800"
            >
              <option value="fit">Fit width</option>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100%</option>
              <option value="1.25">125%</option>
            </select>
          </label>
          <Button onClick={onPrint} title="Open a print-ready view in a new tab (browser Save as PDF)">
            Print
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onExport}
            disabled={status.busy || blocked || pageCount === 0}
            title={blocked ? 'Fix the validation errors before exporting' : 'Render a real multi-page PDF'}
          >
            {status.busy ? 'Exporting…' : 'Export PDF'}
          </Button>
        </div>
      </div>
      {status.message && (
        <div
          className={`border-t px-4 py-1.5 text-xs ${
            status.tone === 'error'
              ? 'border-red-100 bg-red-50 text-red-700'
              : status.tone === 'success'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-slate-100 bg-slate-50 text-slate-600'
          }`}
          role="status"
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
