import { useEffect, useReducer } from 'react';
import type { StatementData } from '../types/statement';
import { isStatementData } from '../lib/schema';
import { createSampleStatement } from '../lib/sampleData';
import { statementReducer, type StatementAction } from './statementReducer';

export const STORAGE_KEY = 'demo-statement-generator:v1';

export function loadStoredStatement(): StatementData | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStatementData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveStatement(data: StatementData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage can be unavailable (private mode, quota). The editor keeps working without it.
  }
}

/** Reducer-backed statement state, persisted to localStorage between sessions. */
export function useStatementStore(): [StatementData, React.Dispatch<StatementAction>] {
  const [data, dispatch] = useReducer(statementReducer, undefined, () => loadStoredStatement() ?? createSampleStatement('small'));

  useEffect(() => {
    saveStatement(data);
  }, [data]);

  return [data, dispatch];
}
