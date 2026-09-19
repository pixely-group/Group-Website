import type { Dispatch } from 'react';
import type { StatementData } from '../../types/statement';
import { issueFor, type ValidationIssue } from '../../lib/validation';
import { setField, type StatementAction } from '../../state/statementReducer';
import { Field } from '../ui/Field';
import { SectionCard } from '../ui/SectionCard';
import { TextArea, TextInput } from '../ui/TextInput';

interface AccountSectionProps {
  data: StatementData;
  issues: ValidationIssue[];
  dispatch: Dispatch<StatementAction>;
}

export function AccountSection({ data, issues, dispatch }: AccountSectionProps) {
  const issue = (field: string) => issueFor(issues, field);
  return (
    <SectionCard title="Account information" description="Printed in the page header and the address block. Use fictional details only.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Account holder (header)" htmlFor="accountHolder" issue={issue('accountHolder')}>
          <TextInput
            id="accountHolder"
            value={data.accountHolder}
            onChange={(value) => dispatch(setField('accountHolder', value))}
            severity={issue('accountHolder')?.severity}
            autoComplete="off"
          />
        </Field>
        <Field label="Product name" htmlFor="productName" issue={issue('productName')}>
          <TextInput
            id="productName"
            value={data.productName}
            onChange={(value) => dispatch(setField('productName', value))}
            severity={issue('productName')?.severity}
            autoComplete="off"
          />
        </Field>
        <Field label="Account number" htmlFor="accountNumber" issue={issue('accountNumber')}>
          <TextInput
            id="accountNumber"
            value={data.accountNumber}
            onChange={(value) => dispatch(setField('accountNumber', value))}
            severity={issue('accountNumber')?.severity}
            inputMode="numeric"
            autoComplete="off"
          />
        </Field>
        <Field label="Sort code" htmlFor="sortCode" issue={issue('sortCode')} hint="Format 00-00-00">
          <TextInput
            id="sortCode"
            value={data.sortCode}
            onChange={(value) => dispatch(setField('sortCode', value))}
            severity={issue('sortCode')?.severity}
            autoComplete="off"
          />
        </Field>
        <Field
          label="Address block"
          htmlFor="address"
          issue={issue('address')}
          hint="One line per row; the first line is normally the full name."
          className="sm:col-span-2"
        >
          <TextArea
            id="address"
            value={data.address}
            onChange={(value) => dispatch(setField('address', value))}
            severity={issue('address')?.severity}
            rows={4}
          />
        </Field>
      </div>
    </SectionCard>
  );
}
