import { DEMO_SITE } from '../content';

/**
 * Structural stand-in for the "overdraft interest and fees" page of the
 * reference: numbered headings, two rate tables, nested lists and closing
 * paragraphs. All products, rates and fees are fictional sample values.
 */
export function InfoPageB() {
  return (
    <div className="legal">
      <h4>
        <span>1.</span>
        <span>Unarranged Overdraft Interest (sample)</span>
      </h4>
      <p>Unarranged overdraft interest is calculated on the daily overdraft balance (including overdraft interest) on an account.</p>
      <p>
        No unarranged overdraft interest is charged on any part of an unarranged overdraft balance which represents an
        Unpaid Transaction Fee.
      </p>
      <p>Any unarranged overdraft created on a sample account would be charged at the following fictional rates:</p>

      <table className="rate-table">
        <colgroup>
          <col style={{ width: '206.9pt' }} />
          <col style={{ width: '72.3pt' }} />
          <col style={{ width: '72.3pt' }} />
          <col style={{ width: '58.1pt' }} />
          <col style={{ width: '72.3pt' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="first">
              <span>Account</span>
            </th>
            <th>
              Nominal
              <br />
              Monthly Rate %
            </th>
            <th>
              Nominal
              <br />
              Annual Rate %
            </th>
            <th>EAR %</th>
            <th>
              Maximum
              <br />
              monthly charge
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="first">Demo Basic, Demo Student, Demo Starter</td>
            <td>0.0</td>
            <td>0.0</td>
            <td>0.0</td>
            <td>£0.00</td>
          </tr>
          <tr>
            <td className="first">
              Demo Current, Demo Reward, Demo Current Silver, Demo Reward Silver, Demo Premier Reward, Demo Reward
              Platinum, Demo Current Platinum, Demo Black Account
            </td>
            <td>0.99</td>
            <td>12.50</td>
            <td>13.25</td>
            <td>£15.00</td>
          </tr>
          <tr>
            <td className="first">Demo Premier Select, Demo Premier Reward Black</td>
            <td>0.90</td>
            <td>11.00</td>
            <td>11.57</td>
            <td>£15.00</td>
          </tr>
        </tbody>
      </table>

      <h4 style={{ marginTop: '2pt' }}>
        <span>2.</span>
        <span>Unpaid Transaction Fees (sample)</span>
      </h4>
      <table className="rate-table fees">
        <colgroup>
          <col style={{ width: '141.7pt' }} />
          <col style={{ width: '161.6pt' }} />
          <col style={{ width: '42.5pt' }} />
          <col style={{ width: '136.1pt' }} />
        </colgroup>
        <thead>
          <tr>
            <th>
              <span>Fee</span>
            </th>
            <th>When it could be charged?</th>
            <th className="center">Amount</th>
            <th>Maximum Monthly Charge</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Unpaid Transaction Fee</td>
            <td>If a payment is instructed that would create an unarranged overdraft and the payment is refused due to lack of funds</td>
            <td className="center">£1.50</td>
            <td>1 fee per charging period (£1.50)</td>
          </tr>
        </tbody>
      </table>
      <p>Unpaid Transaction Fees may be charged on all sample accounts except Demo Basic and Demo Starter.</p>

      <p style={{ marginTop: '5pt' }}>The sample monthly cap on unarranged overdraft charges is £18.00.</p>
      <ol className="legal-list">
        <li>
          <span>1.</span>
          <div>
            Each sample current account sets a monthly maximum charge for:
            <ol>
              <li>
                <span>a.</span>
                <span>going overdrawn when an overdraft has not been arranged; or</span>
              </li>
              <li>
                <span>b.</span>
                <span>going over/past an arranged overdraft limit (if there is one)</span>
              </li>
            </ol>
          </div>
        </li>
        <li>
          <span>2.</span>
          <div>
            This cap covers any:
            <ol>
              <li>
                <span>a.</span>
                <span>Interest and fees for going over/past an arranged overdraft limit;</span>
              </li>
              <li>
                <span>b.</span>
                <span>Fees for each payment the sample bank allows despite lack of funds; and</span>
              </li>
              <li>
                <span>c.</span>
                <span>Fees for each payment the sample bank refuses due to lack of funds.</span>
              </li>
            </ol>
          </div>
        </li>
      </ol>

      <div className="indent">
        <p style={{ marginTop: '3pt' }}>
          A real statement would promise that fees or terms only change for a valid reason with advance notice. This
          sample document makes no such promise because it describes no real product.
        </p>
        <h4 style={{ marginTop: '8pt', marginBottom: 0 }}>And remember...</h4>
        <p>
          A real statement lists where to find fee information here. The sample equivalent would be found at{' '}
          {DEMO_SITE}/sample-charges
        </p>
        <p style={{ marginTop: '3pt' }}>To help manage your money, a real statement suggests that you can:</p>
        <ul className="dash-list">
          <li>
            <span>-</span>
            <span>
              Use a mobile banking app to manage money on the go and check recent transactions. On this sample the
              address {DEMO_SITE}/app is fictional and the app does not exist. The sentence continues so that the item
              wraps onto several lines in the same way as the reference layout.
            </span>
          </li>
          <li>
            <span>-</span>
            <span>
              Look out for alerts to help manage an account. A real statement asks that mobile number and email address
              are kept up to date so that alerts can be sent.
            </span>
          </li>
          <li>
            <span>-</span>
            <span>
              Use Open Banking - this allows banks and other online providers to be given secure access to account
              information that can help manage current accounts. This sample document is not connected to any such
              service.
            </span>
          </li>
        </ul>
        <p style={{ marginTop: '3pt' }}>
          It is important to regularly review an account to ensure it meets your needs. A real statement explains here
          how to convert, close or switch an account using a switching service that offers a secure way to move within a
          fixed number of days. Nothing on this sample document can be switched, closed or converted.
        </p>
        <p>
          As part of regulatory requirements, a real statement mentions independent service quality surveys and where
          their results are published. The sample equivalent would be published at {DEMO_SITE}.
        </p>
      </div>

      <div className="doc-badge" aria-label="Sample badge placeholder">
        <span>SAMPLE DOCUMENT</span>
        <small>NOT A REAL SCHEME MARK</small>
      </div>
    </div>
  );
}
