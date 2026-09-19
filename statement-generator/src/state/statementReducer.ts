import type { CalculationMode, ManualSummary, StatementData, Transaction } from '../types/statement';
import { compareIsoDates } from '../lib/dates';
import { newId } from '../lib/ids';
import { createSampleStatement, generateTransactions } from '../lib/sampleData';

export interface SetFieldAction<K extends keyof StatementData = keyof StatementData> {
  type: 'setField';
  field: K;
  value: StatementData[K];
}

export type StatementAction =
  | SetFieldAction
  | { type: 'setCalculationMode'; mode: CalculationMode }
  | { type: 'setManualSummary'; patch: Partial<ManualSummary> }
  | { type: 'addTransaction'; afterId?: string }
  | { type: 'updateTransaction'; id: string; patch: Partial<Omit<Transaction, 'id'>> }
  | { type: 'removeTransaction'; id: string }
  | { type: 'moveTransaction'; id: string; direction: 'up' | 'down' }
  | { type: 'sortTransactionsByDate' }
  | { type: 'clearTransactions' }
  | { type: 'appendGenerated'; count: number }
  | { type: 'loadSample'; variant: 'small' | 'large' }
  | { type: 'replaceAll'; data: StatementData };

export function setField<K extends keyof StatementData>(field: K, value: StatementData[K]): SetFieldAction<K> {
  return { type: 'setField', field, value };
}

function defaultDateFor(state: StatementData, afterId?: string): string {
  if (afterId) {
    const anchor = state.transactions.find((t) => t.id === afterId);
    if (anchor) return anchor.date;
  }
  const last = state.transactions[state.transactions.length - 1];
  return last ? last.date : state.periodStart;
}

export function statementReducer(state: StatementData, action: StatementAction): StatementData {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.field]: action.value } as StatementData;

    case 'setCalculationMode':
      return { ...state, calculationMode: action.mode };

    case 'setManualSummary':
      return { ...state, manualSummary: { ...state.manualSummary, ...action.patch } };

    case 'addTransaction': {
      const transaction: Transaction = {
        id: newId(),
        date: defaultDateFor(state, action.afterId),
        description: '',
        paidIn: null,
        withdrawn: null,
        balance: null,
      };
      const index = action.afterId ? state.transactions.findIndex((t) => t.id === action.afterId) : -1;
      const transactions = [...state.transactions];
      transactions.splice(index === -1 ? transactions.length : index + 1, 0, transaction);
      return { ...state, transactions };
    }

    case 'updateTransaction':
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      };

    case 'removeTransaction':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };

    case 'moveTransaction': {
      const index = state.transactions.findIndex((t) => t.id === action.id);
      const target = action.direction === 'up' ? index - 1 : index + 1;
      if (index === -1 || target < 0 || target >= state.transactions.length) return state;
      const transactions = [...state.transactions];
      const current = transactions[index];
      const other = transactions[target];
      if (!current || !other) return state;
      transactions[index] = other;
      transactions[target] = current;
      return { ...state, transactions };
    }

    case 'sortTransactionsByDate':
      return {
        ...state,
        transactions: [...state.transactions].sort((a, b) => compareIsoDates(a.date, b.date)),
      };

    case 'clearTransactions':
      return { ...state, transactions: [] };

    case 'appendGenerated': {
      const seed = 1000 + state.transactions.length * 7919;
      const generated = generateTransactions(action.count, state.periodStart, state.periodEnd, seed);
      return { ...state, transactions: [...state.transactions, ...generated] };
    }

    case 'loadSample':
      return createSampleStatement(action.variant);

    case 'replaceAll':
      return action.data;

    default:
      return state;
  }
}
