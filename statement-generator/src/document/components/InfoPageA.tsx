import { DEMO_PHONE, DEMO_SITE } from '../content';

/**
 * Structural stand-in for the "support information" page of the reference:
 * abbreviations, ways to bank, help, contact, compensation and complaints.
 * Every detail is fictional.
 */
export function InfoPageA() {
  return (
    <div className="info-box">
      <section className="info-section">
        <h4>Statement Abbreviations</h4>
        <p>Below are the most common abbreviations for transaction types that may be shown on a sample statement:</p>
        <p>ATM = Automated Teller (Cash) Machine</p>
        <p>FP = Faster Payment</p>
        <p>XFER = Transfer</p>
        <p>PYMT = Payment</p>
        <p>OD = Overdrawn</p>
        <p>
          For a full list, visit <b>{DEMO_SITE}/sample-abbreviations</b>
        </p>
      </section>

      <section className="info-section">
        <h4>Ways to bank with Demo Bank (fictional)</h4>
        <p>Bank anytime, anywhere with our imaginary digital banking services.</p>
        <p>
          To apply for our <b>sample banking app</b>, visit <b>{DEMO_SITE}/app</b>
        </p>
        <p>
          Or to register for <b>Sample Digital Banking</b>, visit <b>{DEMO_SITE}/digital</b>
        </p>
        <p className="gap">
          Our sample app is described here only so this section has the same shape as a real statement. No app,
          website or service exists behind these addresses.
        </p>
      </section>

      <section className="info-section">
        <h4>Need help with your finances</h4>
        <p>
          A real statement would describe a financial health check tool here. On this sample document the paragraph is
          placeholder text used to reproduce the layout of that section.
        </p>
        <p>
          To find out more visit <b>{DEMO_SITE}/sample-health-check</b>
        </p>
        <h4 className="gap">How can I let you know about additional support I need?</h4>
        <p>
          A real statement would explain how to record accessibility or support needs here. This sample document does
          not collect or hold any such information.
        </p>
        <p>
          To find out more visit <b>{DEMO_SITE}/sample-support</b>
        </p>
      </section>

      <section className="info-section">
        <h4>You can change your marketing preferences</h4>
        <p>
          This paragraph reminds a customer that marketing preferences can be reviewed at any time. On this sample
          document it is placeholder copy. In the reference layout the options are listed as follows:
        </p>
        <ul>
          <li>
            Via the <b>sample mobile app</b>.
          </li>
          <li>
            Via <b>Sample Digital Banking</b>.
          </li>
          <li>
            Visiting a <b>sample branch</b>.
          </li>
          <li>
            Calling the sample line on <b>{DEMO_PHONE}</b>.
          </li>
          <li>
            Chatting to <b>Demo</b>, an imaginary digital assistant.
          </li>
        </ul>
        <p>If you do not wish to make any changes that is fine - the sample preferences stay the same.</p>
      </section>

      <section className="info-section">
        <h4>How to contact us</h4>
        <p>
          Chat to <b>Demo</b>, an imaginary digital assistant, at: <b>the sample app, Sample Digital Banking or {DEMO_SITE}</b>
        </p>
        <p>
          Lost or stolen cards and cheque books: <b>{DEMO_PHONE}</b>
        </p>
        <p>
          General enquiries: <b>{DEMO_PHONE}</b>
        </p>
        <p>None of the contact routes above exist. They are shown to reproduce the structure of a real statement.</p>
        <p>
          Please note that no customer number or PIN is associated with this sample document and none should ever be
          entered anywhere in connection with it.
        </p>
      </section>

      <section className="info-section">
        <h4>Important information about compensation arrangements</h4>
        <p>
          A real statement explains deposit protection in this section. This sample document represents no deposit,
          no account and no institution, so no protection scheme applies to it.
        </p>
        <p className="gap">
          Real statements refer readers to an information sheet and a list of exclusions. The sample equivalents would
          be found at: <b>{DEMO_SITE}/sample-information-sheet</b>
        </p>
        <p className="gap">
          If a link on a sample document cannot be opened, that is expected: the addresses are fictional and are not
          registered to anyone.
        </p>
        <p>
          For further information about the sample scheme, refer to the website: <b>{DEMO_SITE}/sample-scheme</b>
        </p>
      </section>

      <section className="info-section">
        <h4>Making a complaint</h4>
        <p>
          A real statement explains how to raise a complaint here. This sample document reproduces the shape of that
          text only. The quickest and easiest way to raise a sample complaint is through <b>Demo</b>, the imaginary
          digital assistant, via the sample app or <b>Sample Digital Banking</b>.
        </p>
        <p className="gap">
          Alternatively, the sample telephone line is <b>{DEMO_PHONE}</b>.
        </p>
        <p>
          To learn more, please visit <b>{DEMO_SITE}/sample-complaints</b>
        </p>
        <p className="gap">
          If a sample complaint could not be resolved within eight weeks, a real statement would explain how to refer
          it to an ombudsman service. No such route applies to a fictional account.
        </p>
      </section>

      <section className="info-section">
        <div className="info-big">
          For a Braille, large print or audio version of this sample statement
          <br />
          call the sample line on {DEMO_PHONE}
          <br />
          (placeholder text - no real service exists behind this notice).
        </div>
      </section>
    </div>
  );
}
