/**
 * Print a sample StatementData document as JSON, ready to POST to /api/export.
 *
 *   node scripts/sample-json.mjs small > small.json
 *   node scripts/sample-json.mjs large > large.json
 *   curl -o out.pdf -H 'content-type: application/json' --data @large.json http://localhost:5173/api/export
 */
import { createServer } from 'vite';

const variant = process.argv[2] === 'large' ? 'large' : 'small';
const server = await createServer({
  configFile: false,
  plugins: [],
  appType: 'custom',
  server: { middlewareMode: true },
  logLevel: 'error',
});
try {
  const mod = await server.ssrLoadModule('/src/lib/sampleData.ts');
  process.stdout.write(JSON.stringify({ data: mod.createSampleStatement(variant) }, null, 2));
} finally {
  await server.close();
}
