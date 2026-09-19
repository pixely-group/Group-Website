import type { Dispatch } from 'react';
import type { StatementAction } from '../state/statementReducer';
import { Button } from './ui/Button';

interface TopBarProps {
  pane: 'editor' | 'preview';
  onPaneChange: (pane: 'editor' | 'preview') => void;
  dispatch: Dispatch<StatementAction>;
}

export function TopBar({ pane, onPaneChange, dispatch }: TopBarProps) {
  return (
    <header className="app-chrome flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">DS</div>
        <div>
          <h1 className="text-sm font-semibold leading-tight text-slate-900">Demo Statement Generator</h1>
          <p className="text-xs leading-tight text-slate-500">Layout prototyping tool · fictional data only</p>
        </div>
      </div>
      <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        Every page is labelled DEMO / SAMPLE — not a real bank statement
      </span>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex rounded-md border border-slate-300 p-0.5 lg:hidden" role="tablist" aria-label="Show">
          <button
            type="button"
            role="tab"
            aria-selected={pane === 'editor'}
            onClick={() => onPaneChange('editor')}
            className={`rounded px-2.5 py-1 text-xs font-medium ${pane === 'editor' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            Editor
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pane === 'preview'}
            onClick={() => onPaneChange('preview')}
            className={`rounded px-2.5 py-1 text-xs font-medium ${pane === 'preview' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            Preview
          </button>
        </div>
        <Button size="sm" onClick={() => dispatch({ type: 'loadSample', variant: 'small' })} title="14 fictional transactions">
          Load small sample
        </Button>
        <Button size="sm" onClick={() => dispatch({ type: 'loadSample', variant: 'large' })} title="110 fictional transactions across several pages">
          Load multi-page sample
        </Button>
      </div>
    </header>
  );
}
