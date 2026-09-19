import type { StatementData, StatementTotals } from '../../types/statement';
import { formatDateLong } from '../../lib/dates';
import { formatCurrency } from '../../lib/money';
import { INTRO, WELCOME_HEADING } from '../content';

interface FirstPageIntroProps {
  data: StatementData;
  printed: StatementTotals;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="label">{label}</td>
      <td className="value">{value}</td>
    </tr>
  );
}

/** Address block, summary box, welcome band and intro lines (first page only). */
export function FirstPageIntro({ data, printed }: FirstPageIntroProps) {
  const addressLines = data.address
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <>
      <div className="doc-address">
        {addressLines.map((line, index) => (
          <div key={`${index}-${line}`}>{line}</div>
        ))}
      </div>

      <div className="doc-summary">
        <div className="doc-summary-title">{data.productName}</div>
        <table className="doc-summary-table">
          <thead>
            <tr>
              <th colSpan={2}>Summary</th>
            </tr>
          </thead>
          <tbody>
            <SummaryRow label="Statement Date" value={formatDateLong(data.statementDate)} />
            <SummaryRow
              label="Period Covered"
              value={`${formatDateLong(data.periodStart)} to ${formatDateLong(data.periodEnd)}`}
            />
            <SummaryRow label="Previous Balance" value={formatCurrency(data.previousBalance)} />
            <SummaryRow label="Paid In" value={formatCurrency(printed.totalPaidIn)} />
            <SummaryRow label="Withdrawn" value={formatCurrency(printed.totalWithdrawn)} />
            <SummaryRow label="New Balance" value={formatCurrency(printed.newBalance)} />
            <SummaryRow label="BIC" value={data.bic} />
            <SummaryRow label="IBAN" value={data.iban} />
          </tbody>
        </table>
      </div>

      <div className="doc-welcome">{WELCOME_HEADING}</div>

      <div className="doc-intro">
        <p>
          {INTRO.line1}
          <b>{INTRO.line1Link}</b>
        </p>
        <p>{INTRO.line2}</p>
      </div>
    </>
  );
}
