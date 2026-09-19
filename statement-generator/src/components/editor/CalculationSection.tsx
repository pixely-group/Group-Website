import type { Dispatch } from 'react';
import type { ComputedStatement, StatementData } from '../../types/statement';
import { formatCurrency, toInputString } from '../../lib/money';
import { issueFor, type ValidationIssue } from '../../lib/validation';
import type { StatementAction } from '../../state/statementReducer';
import { AmountInput } from '../ui/AmountInput';
import { Field } from '../ui/Field';
import { SectionCard } from '../ui/SectionCard';

interface CalculationSectionProps {
  data: StatementData;
  computed: ComputedStatement;
  issues: ValidationIssue[];
  pageCount: number;
  dispatch: Dispatch<StatementAction>;
}

function Stat({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold tabular-nums ${muted ? 'text-slate-500' : 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

export function CalculationSection({ data, computed, issues, pageCount, dispatch }: CalculationSectionProps) {
  const manual = data.calculationMode === 'manual';
  const issue = (field: string) => issueFor(issues, field);

  return (
    <SectionCard
      title="Summary & calculations"
      description="Balances and totals are derived from the transactions. Switch to manual mode to override values for testing."
    >
      <fieldset className="mb-4">
        <legend className="mb-2 text-xs font-medium text-slate-600">Calculation mode</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ModeOption
            checked={!manual}
            title="Automatic"
            description="Running balances, totals and the new balance are calculated for you."
            onSelect={() => dispatch({ type: 'setCalculationMode', mode: 'auto' })}
          />
          <ModeOption
            checked={manual}
            title="Manual overrides"
            description="Type your own balances or totals; anything left blank still uses the computed value."
            onSelect={() => dispatch({ type: 'setCalculationMode', mode: 'manual' })}
          />
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Previous" value={formatCurrency(data.previousBalance)} />
        <Stat label="Paid in" value={formatCurrency(computed.computed.totalPaidIn)} muted={manual} />
        <Stat label="Withdrawn" value={formatCurrency(computed.computed.totalWithdrawn)} muted={manual} />
        <Stat label="New balance" value={formatCurrency(computed.computed.newBalance)} muted={manual} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {data.transactions.length} transaction{data.transactions.length === 1 ? '' : 's'} ·{' '}
        {pageCount > 0 ? `${pageCount} page${pageCount === 1 ? '' : 's'}` : 'measuring pages…'} · opening balance + paid in
        − withdrawn = running balance
      </p>

      {manual && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-3 text-xs text-amber-800">
            Manual mode: the values below are printed in the summary box instead of the computed totals. Leave a field
            blank to keep the computed value. Per-row balance overrides are edited in the transaction list.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Paid in override (£)" htmlFor="ov-paidIn" issue={issue('totalPaidIn')}>
              <AmountInput
                id="ov-paidIn"
                value={data.manualSummary.totalPaidIn}
                placeholder={toInputString(computed.computed.totalPaidIn)}
                onChange={(value) => dispatch({ type: 'setManualSummary', patch: { totalPaidIn: value } })}
              />
            </Field>
            <Field label="Withdrawn override (£)" htmlFor="ov-withdrawn" issue={issue('totalWithdrawn')}>
              <AmountInput
                id="ov-withdrawn"
                value={data.manualSummary.totalWithdrawn}
                placeholder={toInputString(computed.computed.totalWithdrawn)}
                onChange={(value) => dispatch({ type: 'setManualSummary', patch: { totalWithdrawn: value } })}
              />
            </Field>
            <Field label="New balance override (£)" htmlFor="ov-newBalance" issue={issue('newBalance')}>
              <AmountInput
                id="ov-newBalance"
                value={data.manualSummary.newBalance}
                allowNegative
                placeholder={toInputString(computed.printed.newBalance)}
                onChange={(value) => dispatch({ type: 'setManualSummary', patch: { newBalance: value } })}
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-amber-800">
            Printed summary: {formatCurrency(computed.printed.totalPaidIn)} in · {formatCurrency(computed.printed.totalWithdrawn)} out ·{' '}
            {formatCurrency(computed.printed.newBalance)} new balance
          </p>
        </div>
      )}
    </SectionCard>
  );
}

function ModeOption({
  checked,
  title,
  description,
  onSelect,
}: {
  checked: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-2 rounded-lg border p-3 transition ${
        checked ? 'border-slate-900 bg-slate-900/5' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <input type="radio" name="calculationMode" checked={checked} onChange={onSelect} className="mt-0.5 accent-slate-900" />
      <span>
        <span className="block text-sm font-medium text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
    </label>
  );
}
