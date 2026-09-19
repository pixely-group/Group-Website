import type { ManualSummary, StatementData, Transaction } from '../types/statement.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

export function isTransaction(value: unknown): value is Transaction {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.date === 'string' &&
    typeof value.description === 'string' &&
    isNullableNumber(value.paidIn) &&
    isNullableNumber(value.withdrawn) &&
    isNullableNumber(value.balance)
  );
}

function isManualSummary(value: unknown): value is ManualSummary {
  if (!isRecord(value)) return false;
  return (
    isNullableNumber(value.totalPaidIn) &&
    isNullableNumber(value.totalWithdrawn) &&
    isNullableNumber(value.newBalance)
  );
}

const STRING_FIELDS = [
  'accountHolder',
  'address',
  'productName',
  'accountNumber',
  'sortCode',
  'statementDate',
  'periodStart',
  'periodEnd',
  'bic',
  'iban',
] as const;

/** Runtime type guard shared by the browser store and the PDF export endpoint. */
export function isStatementData(value: unknown): value is StatementData {
  if (!isRecord(value)) return false;
  if (!STRING_FIELDS.every((key) => typeof value[key] === 'string')) return false;
  if (typeof value.previousBalance !== 'number' || !Number.isFinite(value.previousBalance)) return false;
  if (value.calculationMode !== 'auto' && value.calculationMode !== 'manual') return false;
  if (!isManualSummary(value.manualSummary)) return false;
  if (!Array.isArray(value.transactions) || !value.transactions.every(isTransaction)) return false;
  return true;
}
