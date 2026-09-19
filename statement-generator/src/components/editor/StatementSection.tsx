import type { Dispatch } from 'react';
import type { StatementData } from '../../types/statement';
import { issueFor, type ValidationIssue } from '../../lib/validation';
import { setField, type StatementAction } from '../../state/statementReducer';
import { AmountInput } from '../ui/AmountInput';
import { Field } from '../ui/Field';
import { SectionCard } from '../ui/SectionCard';
import { TextInput } from '../ui/TextInput';

interface StatementSectionProps {
  data: StatementData;
  issues: ValidationIssue[];
  dispatch: Dispatch<StatementAction>;
}

export function StatementSection({ data, issues, dispatch }: StatementSectionProps) {
  const issue = (field: string) => issueFor(issues, field);
  return (
    <SectionCard title="Statement details" description="Dates, opening balance and the identifiers shown in the summary box.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Statement date" htmlFor="statementDate" issue={issue('statementDate')}>
          <TextInput
            id="statementDate"
            type="date"
            value={data.statementDate}
            onChange={(value) => dispatch(setField('statementDate', value))}
            severity={issue('statementDate')?.severity}
          />
        </Field>
        <Field label="Period start" htmlFor="periodStart" issue={issue('periodStart')}>
          <TextInput
            id="periodStart"
            type="date"
            value={data.periodStart}
            onChange={(value) => dispatch(setField('periodStart', value))}
            severity={issue('periodStart')?.severity}
          />
        </Field>
        <Field label="Period end" htmlFor="periodEnd" issue={issue('periodEnd')}>
          <TextInput
            id="periodEnd"
            type="date"
            value={data.periodEnd}
            onChange={(value) => dispatch(setField('periodEnd', value))}
            severity={issue('periodEnd')?.severity}
          />
        </Field>
        <Field label="Previous balance (£)" htmlFor="previousBalance" issue={issue('previousBalance')} hint="Opening balance at the period start.">
          <AmountInput
            id="previousBalance"
            value={data.previousBalance}
            allowNegative
            onChange={(value) => dispatch(setField('previousBalance', value ?? 0))}
            severity={issue('previousBalance')?.severity}
          />
        </Field>
        <Field label="BIC" htmlFor="bic" issue={issue('bic')}>
          <TextInput
            id="bic"
            value={data.bic}
            onChange={(value) => dispatch(setField('bic', value.toUpperCase()))}
            severity={issue('bic')?.severity}
            autoComplete="off"
          />
        </Field>
        <Field label="IBAN" htmlFor="iban" issue={issue('iban')}>
          <TextInput
            id="iban"
            value={data.iban}
            onChange={(value) => dispatch(setField('iban', value.toUpperCase()))}
            severity={issue('iban')?.severity}
            autoComplete="off"
          />
        </Field>
      </div>
    </SectionCard>
  );
}
