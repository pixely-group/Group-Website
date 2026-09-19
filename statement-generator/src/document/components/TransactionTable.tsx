import type { ComputedTransaction } from '../../types/statement';
import { formatDateLong, formatDateShort } from '../../lib/dates';
import { formatAmount } from '../../lib/money';
import { COLUMNS, pt } from '../layout';

interface TransactionTableProps {
  rows: ComputedTransaction[];
  /** Balance printed on the BROUGHT FORWARD row at the top of the table. */
  broughtForward: number;
  /** When set, the BROUGHT FORWARD row shows this full date (first page only). */
  broughtForwardDate?: string | undefined;
}

/**
 * The transaction table. The same component renders the visible pages and the
 * hidden measurement copy, so row heights are guaranteed to match.
 */
export function TransactionTable({ rows, broughtForward, broughtForwardDate }: TransactionTableProps) {
  return (
    <table className="tx-table">
      <colgroup>
        <col style={{ width: pt(COLUMNS.date) }} />
        <col style={{ width: pt(COLUMNS.description) }} />
        <col style={{ width: pt(COLUMNS.paidIn) }} />
        <col style={{ width: pt(COLUMNS.withdrawn) }} />
        <col style={{ width: pt(COLUMNS.balance) }} />
        <col style={{ width: pt(COLUMNS.spacer) }} />
      </colgroup>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th className="num">Paid In(£)</th>
          <th className="num">Withdrawn(£)</th>
          <th className="num">Balance(£)</th>
          <th className="spacer" aria-hidden="true" />
        </tr>
      </thead>
      <tbody>
        <tr data-bf-row="">
          <td className="date">{broughtForwardDate ? formatDateLong(broughtForwardDate) : ''}</td>
          <td>BROUGHT FORWARD</td>
          <td className="num" />
          <td className="num" />
          <td className="num">{formatAmount(broughtForward)}</td>
          <td className="spacer" />
        </tr>
        {rows.map((row, index) => {
          const previous = rows[index - 1];
          const showDate = index === 0 || previous === undefined || previous.date !== row.date;
          return (
            <tr key={row.id} data-row-index={index} className={index % 2 === 0 ? 'shaded' : undefined}>
              <td className="date">{showDate ? formatDateShort(row.date) : ''}</td>
              <td>{row.description}</td>
              <td className="num">{row.paidIn !== null ? formatAmount(row.paidIn) : ''}</td>
              <td className="num">{row.withdrawn !== null ? formatAmount(row.withdrawn) : ''}</td>
              <td className="num">{formatAmount(row.effectiveBalance)}</td>
              <td className="spacer" />
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
