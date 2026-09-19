import type { ReactNode } from 'react';
import type { StatementData } from '../../types/statement';
import { BRAND, DEMO_FOOTER, DEMO_LABEL, FOOTER_STAMP, LEGAL_FOOTER } from '../content';

interface PageFrameProps {
  data: StatementData;
  pageNumber: number;
  pageCount: number;
  children: ReactNode;
}

/**
 * Common page chrome: header strip, fictional brand mark, the DEMO banner and
 * watermark, and the footer band. The reference prints its regulatory footer
 * on odd (front) pages only, which is mirrored here with fictional text.
 */
export function PageFrame({ data, pageNumber, pageCount, children }: PageFrameProps) {
  const showLegalFooter = pageNumber % 2 === 1;
  return (
    <section className="doc-page" data-page={pageNumber} aria-label={`Sample page ${pageNumber} of ${pageCount}`}>
      <div className="doc-watermark" aria-hidden="true">
        <div className="doc-watermark-text">
          <span>DEMO / SAMPLE</span>
          <small>NOT A REAL BANK STATEMENT</small>
        </div>
      </div>

      <header className="doc-header">
        <div className="doc-header-col doc-header-name">
          <b>Account Name</b>
          <span>{data.accountHolder}</span>
          <span>{data.productName}</span>
        </div>
        <div className="doc-header-col doc-header-acct">
          <b>Account No</b>
          <span>{data.accountNumber}</span>
        </div>
        <div className="doc-header-col doc-header-sort">
          <b>Sort Code</b>
          <span>{data.sortCode}</span>
        </div>
        <div className="doc-header-col doc-header-page">
          <b>Page No</b>
          <span>
            {pageNumber} of {pageCount}
          </span>
        </div>
        <div className="doc-brand" aria-label="Fictional demo bank mark">
          <span className="doc-brand-name">{BRAND.name}</span>
          <span className="doc-brand-tag">{BRAND.tagline}</span>
        </div>
      </header>

      <div className="doc-demo-banner">{DEMO_LABEL}</div>

      {children}

      {showLegalFooter && <footer className="doc-footer-legal">{LEGAL_FOOTER}</footer>}
      <div className="doc-footer-demo">{DEMO_FOOTER}</div>
      <div className="doc-footer-stamp">{FOOTER_STAMP}</div>
    </section>
  );
}
