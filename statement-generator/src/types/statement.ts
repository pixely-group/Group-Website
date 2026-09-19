/**
 * Document data model for the demo statement generator.
 *
 * Everything here describes a SAMPLE document. The generator never produces a
 * real bank statement: every rendered page carries a "DEMO / SAMPLE" label.
 */

export type CalculationMode = 'auto' | 'manual';

export interface Transaction {
  id: string;
  /** ISO calendar date (yyyy-mm-dd). */
  date: string;
  description: string;
  /** Amount credited to the account, in pounds. `null` means no credit. */
  paidIn: number | null;
  /** Amount debited from the account, in pounds. `null` means no debit. */
  withdrawn: number | null;
  /**
   * Manual override of the running balance printed for this row.
   * Only honoured when `StatementData.calculationMode` is `'manual'`.
   */
  balance: number | null;
}

/** Optional manual overrides for the summary box (manual mode only). `null` = use the computed value. */
export interface ManualSummary {
  totalPaidIn: number | null;
  totalWithdrawn: number | null;
  newBalance: number | null;
}

export interface StatementData {
  /** Short name printed in the page header ("Account Name"). */
  accountHolder: string;
  /** Postal block, one line per newline (first line is normally the full name). */
  address: string;
  /** Product name printed under the account holder, e.g. "DEMO CURRENT ACCOUNT". */
  productName: string;
  accountNumber: string;
  sortCode: string;
  /** ISO dates (yyyy-mm-dd). */
  statementDate: string;
  periodStart: string;
  periodEnd: string;
  /** Opening balance at the start of the period, in pounds. */
  previousBalance: number;
  transactions: Transaction[];
  bic: string;
  iban: string;
  calculationMode: CalculationMode;
  manualSummary: ManualSummary;
}

export interface ComputedTransaction extends Transaction {
  /** Running balance derived from the previous row and this row's amounts. */
  computedBalance: number;
  /** Balance actually printed: the manual override in manual mode, otherwise the computed value. */
  effectiveBalance: number;
}

export interface StatementTotals {
  totalPaidIn: number;
  totalWithdrawn: number;
  newBalance: number;
}

export interface ComputedStatement {
  rows: ComputedTransaction[];
  /** Totals derived purely from the transactions. */
  computed: StatementTotals;
  /** Totals printed on the document (manual overrides applied in manual mode). */
  printed: StatementTotals;
}
