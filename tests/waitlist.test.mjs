import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/app/api/waitlist/route.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { POST } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
process.env.BREVO_API_KEY = 'test-key';
process.env.BREVO_WAITLIST_LIST_ID = '12';
process.env.BREVO_SENDER_EMAIL = 'sender@example.com';
delete process.env.AUTH_URL;
let counter = 0;
function request(body, headers = {}) {
  return new Request('https://pixely.example/api/waitlist', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://pixely.example', 'x-forwarded-for': `192.0.2.${++counter}`, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
function mock(responses) {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options, body: options.body && JSON.parse(options.body) });
    assert.ok(responses.length, 'Unexpected provider call');
    const [status, body] = responses.shift();
    return new Response(status === 204 ? null : JSON.stringify(body), { status });
  };
  return calls;
}

test('rejects malformed, cross-origin and oversized submissions without contacting Brevo', async () => {
  const calls = mock([]);
  assert.equal((await POST(request({ email: 'invalid' }))).status, 400);
  assert.equal((await POST(request('null'))).status, 400);
  assert.equal((await POST(request('{'))).status, 400);
  assert.equal((await POST(request({ email: 'a@example.com' }, { origin: 'https://other.example' }))).status, 403);
  assert.equal((await POST(request('x'.repeat(2049)))).status, 413);
  assert.equal((await POST(request({ website: 'bot', email: 'bot@example.com' }))).status, 200);
  assert.equal(calls.length, 0);
});

test('saves normalized contact, sends confirmation, then records delivery acceptance', async () => {
  const calls = mock([[404, {}], [201, { id: 1 }], [201, { messageId: 'test' }], [204]]);
  assert.equal((await POST(request({ email: ' New@Example.com ' }))).status, 200);
  assert.deepEqual(calls[1].body, { email: 'new@example.com', listIds: [12], updateEnabled: true });
  assert.equal(calls[2].body.to[0].email, 'new@example.com');
  assert.match(calls[2].body.textContent, /moment your spot is ready/);
  assert.deepEqual(calls[3].body.attributes, { PIXELY_WAITLIST_CONFIRMED: true });
});

test('repeat and suppressed contacts do not receive another email', async () => {
  for (const contact of [{ attributes: { PIXELY_WAITLIST_CONFIRMED: true } }, { emailBlacklisted: true }]) {
    const calls = mock([[200, contact]]);
    assert.equal((await POST(request({ email: `repeat${counter}@example.com` }))).status, 200);
    assert.equal(calls.length, 1);
  }
});

test('failed confirmation is retryable and never marked confirmed', async () => {
  const calls = mock([[200, { attributes: {} }], [204], [503, { code: 'unavailable' }]]);
  assert.equal((await POST(request({ email: 'retry@example.com' }))).status, 503);
  assert.equal(calls.length, 3);
  const retry = mock([[200, { attributes: {} }], [204], [201, {}], [204]]);
  assert.equal((await POST(request({ email: 'retry@example.com' }))).status, 200);
  assert.equal(calls[2].body.headers.idempotencyKey, retry[2].body.headers.idempotencyKey);
});

test('provider idempotency responses complete bookkeeping without resending', async () => {
  mock([[200, { attributes: {} }], [204], [400, { code: 'duplicate_parameter' }], [204]]);
  assert.equal((await POST(request({ email: 'concurrent@example.com' }))).status, 200);
});

test('provider failure cannot report successful signup', async () => {
  mock([[401, { code: 'unauthorized' }]]);
  assert.equal((await POST(request({ email: 'blocked@example.com' }))).status, 503);
});

test('repeated attempts are throttled', async () => {
  for (let i = 0; i < 3; i++) {
    mock([[200, { attributes: { PIXELY_WAITLIST_CONFIRMED: true } }]]);
    assert.equal((await POST(request({ email: 'limit@example.com' }))).status, 200);
  }
  mock([]);
  assert.equal((await POST(request({ email: 'limit@example.com' }))).status, 429);
});
