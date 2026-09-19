import { useMemo, type Dispatch } from 'react';
import type { ComputedStatement, StatementData } from '../../types/statement';
import type { ValidationIssue } from '../../lib/validation';
import type { StatementAction } from '../../state/statementReducer';
import { Button } from '../ui/Button';
import { SectionCard } from '../ui/SectionCard';
import { TransactionRowEditor } from './TransactionRowEditor';

interface TransactionsEditorProps {
  data: StatementData;
  computed: ComputedStatement;
  issues: ValidationIssue[];
  dispatch: Dispatch<StatementAction>;
}

const EMPTY: ValidationIssue[] = [];

export function TransactionsEditor({ data, computed, issues, dispatch }: TransactionsEditorProps) {
  const manual = data.calculationMode === 'manual';

  const issuesById = useMemo(() => {
    const map = new Map<string, ValidationIssue[]>();
    for (const issue of issues) {
      if (!issue.transactionId) continue;
      const list = map.get(issue.transactionId);
      if (list) list.push(issue);
      else map.set(issue.transactionId, [issue]);
    }
    return map;
  }, [issues]);

  const count = computed.rows.length;

  return (
    <SectionCard
      title="Transactions"
      description="Rows print in this order. Balances recalculate as you type; pages re-flow automatically."
      actions={
        <>
          <Button size="sm" onClick={() => dispatch({ type: 'sortTransactionsByDate' })} disabled={count < 2}>
            Sort by date
          </Button>
          <Button size="sm" onClick={() => dispatch({ type: 'appendGenerated', count: 40 })}>
            + 40 demo rows
          </Button>
          <Button size="sm" variant="danger" onClick={() => dispatch({ type: 'clearTransactions' })} disabled={count === 0}>
            Clear all
          </Button>
        </>
      }
    >
      {count === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No transactions yet. Add one below or generate demo rows.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {computed.rows.map((row, index) => (
            <TransactionRowEditor
              key={row.id}
              transaction={row}
              index={index}
              count={count}
              manual={manual}
              issues={issuesById.get(row.id) ?? EMPTY}
              dispatch={dispatch}
            />
          ))}
        </ol>
      )}
      <div className="mt-3 flex justify-center">
        <Button variant="primary" onClick={() => dispatch({ type: 'addTransaction' })}>
          + Add transaction
        </Button>
      </div>
    </SectionCard>
  );
}
