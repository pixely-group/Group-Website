import { memo, useState, type Dispatch } from 'react';
import type { ComputedTransaction, Transaction } from '../../types/statement';
import { formatAmount, toInputString } from '../../lib/money';
import { issueFor, type ValidationIssue } from '../../lib/validation';
import type { StatementAction } from '../../state/statementReducer';
import { AmountInput } from '../ui/AmountInput';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { TextInput } from '../ui/TextInput';

interface TransactionRowEditorProps {
  transaction: ComputedTransaction;
  index: number;
  count: number;
  manual: boolean;
  /** Issues scoped to this transaction only (keeps memoisation effective). */
  issues: ValidationIssue[];
  dispatch: Dispatch<StatementAction>;
}

export const TransactionRowEditor = memo(function TransactionRowEditor({
  transaction,
  index,
  count,
  manual,
  issues,
  dispatch,
}: TransactionRowEditorProps) {
  const [paidInError, setPaidInError] = useState<string | null>(null);
  const [withdrawnError, setWithdrawnError] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const update = (patch: Partial<Omit<Transaction, 'id'>>) =>
    dispatch({ type: 'updateTransaction', id: transaction.id, patch });
  const issue = (field: string) => issueFor(issues, field, transaction.id);
  const idFor = (field: string) => `tx-${transaction.id}-${field}`;

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
      <div className="flex items-start gap-2">
        <span className="mt-7 w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-400">{index + 1}</span>
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
          <Field label="Date" htmlFor={idFor('date')} issue={issue('date')}>
            <TextInput
              id={idFor('date')}
              type="date"
              value={transaction.date}
              onChange={(value) => update({ date: value })}
              severity={issue('date')?.severity}
            />
          </Field>
          <Field label="Description" htmlFor={idFor('description')} issue={issue('description')}>
            <TextInput
              id={idFor('description')}
              value={transaction.description}
              onChange={(value) => update({ description: value })}
              severity={issue('description')?.severity}
              placeholder="e.g. Card Transaction 0000 01AUG26 DEMO STORE"
              autoComplete="off"
            />
          </Field>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            size="sm"
            variant="ghost"
            aria-label="Move transaction up"
            title="Move up"
            disabled={index === 0}
            onClick={() => dispatch({ type: 'moveTransaction', id: transaction.id, direction: 'up' })}
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Move transaction down"
            title="Move down"
            disabled={index === count - 1}
            onClick={() => dispatch({ type: 'moveTransaction', id: transaction.id, direction: 'down' })}
          >
            ↓
          </Button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 pl-8 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Field label="Paid in (£)" htmlFor={idFor('paidIn')} issue={issue('paidIn')} inputError={paidInError}>
          <AmountInput
            id={idFor('paidIn')}
            value={transaction.paidIn}
            onChange={(value) => update({ paidIn: value })}
            onErrorChange={setPaidInError}
            severity={issue('paidIn')?.severity}
          />
        </Field>
        <Field label="Withdrawn (£)" htmlFor={idFor('withdrawn')} issue={issue('withdrawn')} inputError={withdrawnError}>
          <AmountInput
            id={idFor('withdrawn')}
            value={transaction.withdrawn}
            onChange={(value) => update({ withdrawn: value })}
            onErrorChange={setWithdrawnError}
            severity={issue('withdrawn')?.severity}
          />
        </Field>
        {manual ? (
          <Field
            label="Balance override (£)"
            htmlFor={idFor('balance')}
            issue={issue('balance')}
            inputError={balanceError}
            hint={`Computed: ${formatAmount(transaction.computedBalance)}`}
          >
            <AmountInput
              id={idFor('balance')}
              value={transaction.balance}
              allowNegative
              placeholder={toInputString(transaction.computedBalance)}
              onChange={(value) => update({ balance: value })}
              onErrorChange={setBalanceError}
              severity={issue('balance')?.severity}
            />
          </Field>
        ) : (
          <Field label="Balance (£)">
            <div className="flex h-9 items-center justify-end rounded-md border border-slate-200 bg-slate-50 px-2.5 text-sm font-medium tabular-nums text-slate-700">
              {formatAmount(transaction.effectiveBalance)}
            </div>
          </Field>
        )}
        <div className="flex items-end gap-1">
          <Button
            size="md"
            variant="ghost"
            title="Insert a transaction after this one"
            aria-label="Insert transaction after"
            onClick={() => dispatch({ type: 'addTransaction', afterId: transaction.id })}
          >
            +
          </Button>
          <Button
            size="md"
            variant="danger"
            title="Remove this transaction"
            aria-label="Remove transaction"
            onClick={() => dispatch({ type: 'removeTransaction', id: transaction.id })}
          >
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
});
