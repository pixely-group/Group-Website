# Demo Statement Generator

A small React + TypeScript application that recreates the *structure* of a
multi-page UK current-account statement as a reusable, editable layout for
testing and prototyping (document parsers, print pipelines, UI mock-ups).

> **Every generated page is labelled "DEMO / SAMPLE — NOT A REAL BANK STATEMENT".**
> The label, watermark and footer are part of the document template and cannot
> be switched off. The bank identity, contact details, rates and legal text are
> fictional, and the default sample account identifiers are deliberately invalid
> (sort code `00-00-00`, IBAN checksum `00`). No logos, security features or
> verification marks of any real bank are reproduced.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (default http://localhost:5173).

PDF export renders the document in headless Chromium through Playwright. The
export endpoint uses Playwright's bundled Chromium when it is installed, and
otherwise falls back to a locally installed Google Chrome. To install the
bundled browser (recommended for reproducible output):

```bash
npm run browser:install
```

Other scripts: `npm test` (unit tests for calculations, validation, pagination,
formatting), `npm run typecheck`, `npm run build` + `npm run preview`
(production build; the export endpoint is also attached to the preview server),
and `node scripts/sample-json.mjs large > large.json` to dump a sample document
as JSON for driving the export endpoint from a script:

```bash
curl -o sample.pdf -H 'content-type: application/json' --data @large.json http://localhost:5173/api/export
```

## What it does

* **Editor (left)** – account information, statement details, calculation mode
  and a transaction list with add / insert / remove / reorder, inline
  validation and live currency parsing.
* **Automatic calculations** – `opening balance + paid in − withdrawn` per row,
  totals for paid in / withdrawn and the new balance are derived from the
  transactions. **Manual mode** lets you override any row balance or summary
  total for testing; blank overrides fall back to the computed value.
* **Live preview (right)** – real A4 pages at exact point dimensions, scaled to
  fit. Page count, running balances and page breaks update as you type.
* **Pagination** – row heights are measured from a hidden render of the real
  table, then rows are packed into pages so a row is never split. Each page
  repeats the table header and a `BROUGHT FORWARD` row with the correct
  balance; the interest/overdraft block follows the table or moves to its own
  page; two informational pages always close the document.
* **Export PDF** – `POST /api/export` opens the `/print` route in headless
  Chromium with the submitted data and returns `page.pdf()`. Because it is the
  same React component and CSS as the preview, the PDF matches the preview
  page for page, with selectable text.
* **Print** – opens `/print?autoprint=1` in a new tab for the browser's own
  *Save as PDF* if you prefer not to run Playwright.

## Project layout

```
server/pdfExportPlugin.ts     Vite plugin: /api/export → Playwright → PDF
src/types/statement.ts        StatementData / Transaction data model
src/lib/calculations.ts       running balances and totals (pence arithmetic)
src/lib/validation.ts         field + transaction validation (errors/warnings)
src/lib/money.ts, dates.ts    parsing and formatting
src/lib/sampleData.ts         fictional sample and demo-row generator
src/lib/schema.ts             runtime type guard shared by client and server
src/state/                    reducer + localStorage-backed store
src/document/layout.ts        page geometry measured from the reference (pt)
src/document/pagination.ts    pure page-packing algorithm
src/document/document.css     document styles in points (screen + print)
src/document/components/      page frame, first-page blocks, table, info pages
src/document/StatementDocument.tsx  measurement → pagination → pages
src/components/               editor, preview and UI primitives
src/export/exportPdf.ts       client for the export endpoint
src/print/PrintApp.tsx        document-only route used for PDF/print
tests/                        vitest unit tests
```

## Notes on the layout

Geometry (margins, column widths, row spacing, type sizes) was measured from
the reference PDF: 20 mm side margins, a 481.9 pt content width, 8 pt table
text on a 12.4 pt row pitch, an 18 pt table header, the first-page table
starting at 322.8 pt and continuation tables at 87.9 pt. Fonts are a system
sans-serif stack, so output is deterministic on any machine without web fonts.
