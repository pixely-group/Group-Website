import type { StatementData } from '../types/statement';

export interface ExportResult {
  ok: boolean;
  message: string;
}

export function buildPdfFilename(data: StatementData): string {
  const safe = (value: string) => value.replace(/[^0-9a-zA-Z-]+/g, '') || 'undated';
  return `demo-sample-statement-${safe(data.periodStart)}-to-${safe(data.periodEnd)}.pdf`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
      return body.error;
    }
  } catch {
    // fall through
  }
  return `Export failed (HTTP ${response.status}).`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Ask the dev/preview server to render the current document to a real PDF.
 * The server opens the same React document in headless Chromium and prints it,
 * so the file matches the on-screen preview page for page.
 */
export async function exportStatementPdf(data: StatementData): Promise<ExportResult> {
  let response: Response;
  try {
    response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data }),
    });
  } catch {
    return {
      ok: false,
      message:
        'Could not reach the PDF service. Run the app with "npm run dev" or "npm run preview" so the export endpoint is available, or use Print → Save as PDF.',
    };
  }

  if (!response.ok) {
    return { ok: false, message: await readErrorMessage(response) };
  }

  const blob = await response.blob();
  if (!blob.type.includes('application/pdf')) {
    return { ok: false, message: 'The export endpoint did not return a PDF. Check the server log for details.' };
  }

  const filename = buildPdfFilename(data);
  triggerDownload(blob, filename);
  return { ok: true, message: `Exported ${filename}` };
}
