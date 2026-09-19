import type { StatementData, Transaction } from '../types/statement';
import { compareIsoDates, isValidIsoDate } from './dates';

export type Severity = 'error' | 'warning';

export interface ValidationIssue {
  severity: Severity;
  /** Field key, e.g. "accountHolder" or, for transactions, "date" | "description" | "paidIn" | "withdrawn" | "balance". */
  field: string;
  message: string;
  transactionId?: string;
}

const SORT_CODE = /^\d{2}-\d{2}-\d{2}$/;
const ACCOUNT_NUMBER = /^\d{8}$/;
const BIC = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
const IBAN = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;

export function validateStatement(data: StatementData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const error = (field: string, message: string) => issues.push({ severity: 'error', field, message });
  const warning = (field: string, message: string) => issues.push({ severity: 'warning', field, message });

  if (!data.accountHolder.trim()) error('accountHolder', 'Account holder name is required');
  if (!data.address.trim()) error('address', 'Address is required');
  if (!data.productName.trim()) warning('productName', 'Product name is empty');
  if (!ACCOUNT_NUMBER.test(data.accountNumber.trim())) warning('accountNumber', 'Account numbers are usually 8 digits');
  if (!SORT_CODE.test(data.sortCode.trim())) warning('sortCode', 'Use the format 00-00-00');

  for (const field of ['statementDate', 'periodStart', 'periodEnd'] as const) {
    if (!isValidIsoDate(data[field])) error(field, 'Enter a valid date');
  }
  const periodValid = isValidIsoDate(data.periodStart) && isValidIsoDate(data.periodEnd);
  if (periodValid && compareIsoDates(data.periodStart, data.periodEnd) > 0) {
    error('periodEnd', 'Period end must be on or after the period start');
  }
  if (!Number.isFinite(data.previousBalance)) error('previousBalance', 'Enter a valid opening balance');

  const bic = data.bic.trim().toUpperCase();
  if (bic && !BIC.test(bic)) warning('bic', 'BICs are 8 or 11 letters/digits');
  const iban = data.iban.replace(/\s/g, '').toUpperCase();
  if (iban && !IBAN.test(iban)) warning('iban', 'IBAN format looks unusual (2 letters, 2 digits, then 11–30 characters)');

  if (data.calculationMode === 'manual') {
    for (const key of ['totalPaidIn', 'totalWithdrawn', 'newBalance'] as const) {
      const value = data.manualSummary[key];
      if (value !== null && !Number.isFinite(value)) error(key, 'Enter a valid amount');
    }
  }

  for (const transaction of data.transactions) {
    validateTransaction(transaction, data, periodValid, issues);
  }
  return issues;
}

function validateTransaction(
  transaction: Transaction,
  data: StatementData,
  periodValid: boolean,
  issues: ValidationIssue[],
): void {
  const push = (severity: Severity, field: string, message: string) =>
    issues.push({ severity, field, message, transactionId: transaction.id });

  if (!isValidIsoDate(transaction.date)) {
    push('error', 'date', 'Enter a valid date');
  } else if (
    periodValid &&
    (compareIsoDates(transaction.date, data.periodStart) < 0 || compareIsoDates(transaction.date, data.periodEnd) > 0)
  ) {
    push('warning', 'date', 'Date is outside the statement period');
  }

  if (!transaction.description.trim()) push('error', 'description', 'Description is required');

  for (const field of ['paidIn', 'withdrawn'] as const) {
    const value = transaction[field];
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      push('error', field, 'Amount must be a non-negative number');
    }
  }
  if (transaction.paidIn === null && transaction.withdrawn === null) {
    push('warning', 'paidIn', 'Enter a Paid In or Withdrawn amount');
  } else if (transaction.paidIn !== null && transaction.withdrawn !== null) {
    push('warning', 'withdrawn', 'A row normally has either Paid In or Withdrawn, not both');
  }

  if (data.calculationMode === 'manual' && transaction.balance !== null && !Number.isFinite(transaction.balance)) {
    push('error', 'balance', 'Enter a valid balance');
  }
}

export function countIssues(issues: ValidationIssue[]): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;
  for (const issue of issues) {
    if (issue.severity === 'error') errors += 1;
    else warnings += 1;
  }
  return { errors, warnings };
}

/** The most severe issue for a field (optionally scoped to one transaction). */
export function issueFor(
  issues: ValidationIssue[],
  field: string,
  transactionId?: string,
): ValidationIssue | undefined {
  let found: ValidationIssue | undefined;
  for (const issue of issues) {
    if (issue.field !== field) continue;
    if ((issue.transactionId ?? undefined) !== transactionId) continue;
    if (!found || (found.severity === 'warning' && issue.severity === 'error')) found = issue;
  }
  return found;
}

export function issuesForTransaction(issues: ValidationIssue[], transactionId: string): ValidationIssue[] {
  return issues.filter((issue) => issue.transactionId === transactionId);
}
