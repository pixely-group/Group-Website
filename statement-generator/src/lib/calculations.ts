import type { ComputedStatement, ComputedTransaction, StatementData, StatementTotals } from '../types/statement';
import { fromPence, toPence } from './money';

/**
 * Derive every printed number from the transaction list.
 *
 *   opening balance + paid in − withdrawn = running balance
 *
 * In automatic mode all balances and totals are computed. In manual mode a row's
 * `balance` override (when set) replaces the computed running balance and the
 * following rows continue from the override; the summary box uses any manual
 * totals that are set, otherwise the computed ones.
 */
export function computeStatement(data: StatementData): ComputedStatement {
  const manual = data.calculationMode === 'manual';
  let runningPence = toPence(data.previousBalance);
  let paidInPence = 0;
  let withdrawnPence = 0;

  const rows: ComputedTransaction[] = data.transactions.map((transaction) => {
    const inPence = toPence(transaction.paidIn ?? 0);
    const outPence = toPence(transaction.withdrawn ?? 0);
    paidInPence += inPence;
    withdrawnPence += outPence;

    const computedPence = runningPence + inPence - outPence;
    const effectivePence =
      manual && transaction.balance !== null ? toPence(transaction.balance) : computedPence;
    runningPence = effectivePence;

    return {
      ...transaction,
      computedBalance: fromPence(computedPence),
      effectiveBalance: fromPence(effectivePence),
    };
  });

  const computed: StatementTotals = {
    totalPaidIn: fromPence(paidInPence),
    totalWithdrawn: fromPence(withdrawnPence),
    newBalance: fromPence(toPence(data.previousBalance) + paidInPence - withdrawnPence),
  };

  const lastRow = rows[rows.length - 1];
  const chainedNewBalance = lastRow ? lastRow.effectiveBalance : data.previousBalance;

  const printed: StatementTotals = manual
    ? {
        totalPaidIn: data.manualSummary.totalPaidIn ?? computed.totalPaidIn,
        totalWithdrawn: data.manualSummary.totalWithdrawn ?? computed.totalWithdrawn,
        newBalance: data.manualSummary.newBalance ?? chainedNewBalance,
      }
    : computed;

  return { rows, computed, printed };
}
