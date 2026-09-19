import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, PreviewServer, ViteDevServer } from 'vite';
import { chromium, type Browser } from 'playwright';
import { isStatementData } from '../src/lib/schema.ts';

const ROUTE = '/api/export';
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const RENDER_TIMEOUT_MS = 45_000;

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Lazily launched, shared Chromium instance. */
class BrowserPool {
  private browser: Promise<Browser> | null = null;

  get(): Promise<Browser> {
    if (!this.browser) {
      const launching = launchBrowser();
      this.browser = launching;
      launching
        .then((browser) => browser.once('disconnected', () => (this.browser = null)))
        .catch(() => (this.browser = null));
    }
    return this.browser;
  }

  async close(): Promise<void> {
    const pending = this.browser;
    this.browser = null;
    if (!pending) return;
    try {
      const browser = await pending;
      await browser.close();
    } catch {
      // already gone
    }
  }
}

async function launchBrowser(): Promise<Browser> {
  const attempts: Array<[label: string, launch: () => Promise<Browser>]> = [
    ['bundled Chromium', () => chromium.launch()],
    ['Google Chrome', () => chromium.launch({ channel: 'chrome' })],
  ];
  const failures: string[] = [];
  for (const [label, launch] of attempts) {
    try {
      const browser = await launch();
      console.log(`[pdf-export] using ${label}`);
      return browser;
    } catch (error) {
      failures.push(`${label}: ${errorMessage(error).split('\n')[0] ?? 'failed'}`);
    }
  }
  throw new Error(
    `No Chromium-based browser is available for PDF export. Run "npm run browser:install" (downloads Chromium) or install Google Chrome. ${failures.join(' | ')}`,
  );
}

function resolveOrigin(server: ViteDevServer | PreviewServer): string {
  const local = server.resolvedUrls?.local[0];
  if (local) return local.replace(/\/$/, '');
  const address = server.httpServer?.address();
  if (address && typeof address === 'object') {
    const protocol = server.config.server.https ? 'https' : 'http';
    return `${protocol}://127.0.0.1:${address.port}`;
  }
  throw new Error('Cannot determine the local server URL for rendering');
}

async function renderPdf(browser: Browser, origin: string, data: unknown): Promise<Buffer> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    await context.addInitScript((payload: unknown) => {
      (window as unknown as { __STATEMENT_DATA__?: unknown }).__STATEMENT_DATA__ = payload;
    }, data);
    const page = await context.newPage();
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);
    await page.goto(`${origin}/print`, { waitUntil: 'load' });
    await page.waitForSelector('body[data-print-ready="true"]', { state: 'attached' });
    await page.emulateMedia({ media: 'print' });
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } finally {
    await context.close();
  }
}

async function handleExport(
  req: IncomingMessage,
  res: ServerResponse,
  server: ViteDevServer | PreviewServer,
  pool: BrowserPool,
): Promise<void> {
  const raw = await readBody(req);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Request body must be JSON');
  }
  const data = body && typeof body === 'object' && 'data' in body ? (body as { data: unknown }).data : undefined;
  if (!isStatementData(data)) {
    throw new HttpError(400, 'Request body must contain a valid statement document under "data"');
  }

  const started = Date.now();
  const browser = await pool.get();
  const pdf = await renderPdf(browser, resolveOrigin(server), data);
  console.log(`[pdf-export] rendered ${pdf.length} bytes in ${Date.now() - started}ms`);

  res.statusCode = 200;
  res.setHeader('content-type', 'application/pdf');
  res.setHeader('content-length', String(pdf.length));
  res.setHeader('cache-control', 'no-store');
  res.end(pdf);
}

function attach(server: ViteDevServer | PreviewServer): void {
  const pool = new BrowserPool();
  server.httpServer?.once('close', () => void pool.close());

  server.middlewares.use(ROUTE, (req, res, next) => {
    if (req.method !== 'POST') {
      if (req.method === 'GET' || req.method === 'HEAD') {
        sendJson(res, 405, { error: 'Send a POST request with { "data": StatementData } to export a PDF' });
        return;
      }
      next();
      return;
    }
    handleExport(req, res, server, pool).catch((error: unknown) => {
      const status = error instanceof HttpError ? error.status : 500;
      if (status === 500) console.error('[pdf-export] failed:', error);
      if (!res.headersSent) sendJson(res, status, { error: errorMessage(error) });
      else res.end();
    });
  });
}

/**
 * Vite plugin that adds POST /api/export to the dev and preview servers. It
 * opens the app's /print route in headless Chromium with the submitted data
 * and returns page.pdf(), so the PDF is the same rendering as the preview.
 */
export function pdfExportPlugin(): Plugin {
  return {
    name: 'demo-statement-pdf-export',
    configureServer(server) {
      attach(server);
    },
    configurePreviewServer(server) {
      attach(server);
    },
  };
}
