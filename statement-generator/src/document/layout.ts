/**
 * Page geometry measured from the reference document (A4 portrait).
 * All values are PostScript points; the CSS uses `pt` units so the on-screen
 * preview and the printed PDF share exactly the same layout.
 */

/** CSS pixels per point (Chromium lays out at 96 dpi). */
export const PX_PER_PT = 96 / 72;

export const pt = (value: number): string => `${value}pt`;

export const PAGE = { width: 595.28, height: 841.89 } as const;
export const MARGIN_LEFT = 56.7;
export const CONTENT_WIDTH = 481.9;

export const LAYOUT = {
  headerTop: 28,
  /** Top of the transaction table on the first page (below address, summary and welcome band). */
  firstPageTableTop: 322.8,
  /** Top of the transaction table on continuation pages. */
  continuationTableTop: 87.9,
  /** Rows must finish above this y so they never collide with the footer band. */
  tableBottomLimit: 770,
  /** Gap between the end of the table and the interest/overdraft information block. */
  tailGap: 14,
  /** Top of the flowing content on the informational pages. */
  infoTop: 87.9,
} as const;

export type Layout = typeof LAYOUT;

/** Transaction table column widths (sum = CONTENT_WIDTH). */
export const COLUMNS = {
  date: 51,
  description: 229.6,
  paidIn: 56.7,
  withdrawn: 56.7,
  balance: 68,
  spacer: 19.9,
} as const;
