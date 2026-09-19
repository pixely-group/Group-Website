interface InterestInfoProps {
  /** True when the block is printed on a page of its own (no table above it). */
  standalone?: boolean;
}

function RateRow({ label, nar, ear }: { label: string; nar: string; ear: string }) {
  return (
    <div className="tail-rate-row">
      <span>{label}</span>
      <span>{nar}</span>
      <span>{ear}</span>
    </div>
  );
}

/**
 * Interest and overdraft information that follows the transaction table.
 * All rates and wording are fictional sample content.
 */
export function InterestInfo({ standalone = false }: InterestInfoProps) {
  return (
    <div className={standalone ? 'tail tail-standalone' : 'tail'} data-tail="">
      <div className="tail-box">
        <div className="tail-title">
          <span>Interest (variable) charged on overdrawn balances — sample rates</span>
        </div>
        <div className="tail-section">
          <div className="tail-sub">When you stay within your arranged overdraft limit</div>
          <div>Amount account overdrawn by:</div>
          <RateRow label="Over £0" nar="12.50% NAR" ear="13.25% EAR" />
          <div className="tail-sub">When you go over your arranged overdraft limit</div>
          <div>Rate that applies on the amount:</div>
          <RateRow label="Up to your arranged limit" nar="12.50% NAR" ear="13.25% EAR" />
          <RateRow label="Above your arranged limit" nar="12.50% NAR" ear="13.25% EAR" />
          <div className="tail-sub">When you do not have an arranged overdraft limit</div>
          <RateRow label="Applicable rate on full amount" nar="12.50% NAR" ear="13.25% EAR" />
        </div>
        <div className="tail-title" style={{ borderTop: '0.75pt solid var(--doc-rule)' }}>
          <span>Interest (variable) paid on credit balances — sample</span>
        </div>
        <div className="tail-section">No credit interest is paid on this sample account.</div>
      </div>

      <div className="tail-box black">
        <h4>Overdraft Arrangements (sample text)</h4>
        <p>
          This paragraph stands in for the overdraft arrangements notice that appears on a real statement. On this
          sample document it exists only to reproduce the layout: the figures, dates and conditions below are invented
          and carry no meaning. For example, a sample unpaid transaction fee of £1.50 and a sample monthly cap of £18.00
          are shown purely so the text wraps to a realistic length.
        </p>
        <p>
          Any charges on a real account would be explained in a separate pre-notification. No charges apply to this
          sample account because it does not exist.
        </p>
        <p>
          <b>NAR</b> - the Nominal Annual Rate is the annual rate of interest charged on an overdraft. It does not take
          into account interest charged on interest already added to the balance in the previous month.
        </p>
        <p>
          <b>EAR</b> - the Effective Annual Rate shows the cost of an overdraft as a yearly rate, taking into account how
          often interest is charged to the account, where this applies.
        </p>
        <p>
          <b>AER</b> - the Annual Equivalent Rate is used where an account earns interest. It shows what the gross rate
          would be if interest were paid and compounded once each year.
        </p>
      </div>
    </div>
  );
}
