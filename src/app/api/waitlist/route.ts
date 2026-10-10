import { createHash } from "node:crypto";

export const runtime = "nodejs";

const CONFIRMED = "PIXELY_WAITLIST_CONFIRMED";
const success = () => Response.json({ ok: true });
const failure = (error: string, status = 503) => Response.json({ error }, { status });

// Best-effort per-instance throttling. Production should also apply a shared
// rate limit at the hosting edge; forwarding headers must be set by that proxy.
const attempts = new Map<string, { count: number; until: number }>();
function limited(key: string, max: number) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const entry = attempts.get(key) ?? { count: 0, until: now + 60_000 };
  if (attempts.size >= 5000 && !attempts.has(key)) return true;
  entry.count++;
  attempts.set(key, entry);
  return entry.count > max;
}

class BrevoError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super("Brevo request failed");
  }
}

async function brevo(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`https://api.brevo.com/v3/${path}`, {
    method,
    headers: { "api-key": process.env.BREVO_API_KEY!, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new BrevoError(response.status, data.code || "unknown");
  return data;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.AUTH_URL ? new URL(process.env.AUTH_URL).origin : new URL(request.url).origin;
  if (origin && origin !== expected) return failure("Please join from the Pixely website.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return failure("Invalid request.", 415);

  let body;
  try {
    // Read a bounded stream rather than trusting a client-supplied Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return failure("Invalid request.", 400);
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 2048) { await reader.cancel(); return failure("Request too large.", 413); }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return failure("Invalid request.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return failure("Invalid request.", 400);
  if (body.website) return success();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
    return failure("Please enter a valid email address.", 400);
  }
  const hash = createHash("sha256").update(email).digest("hex");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(`ip:${ip}`, 10) || limited(`email:${hash}`, 3)) {
    return failure("Too many attempts. Please try again in a minute.", 429);
  }
  const listId = Number(process.env.BREVO_WAITLIST_LIST_ID);
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !Number.isSafeInteger(listId) || listId <= 0) {
    return failure("The waitlist is temporarily unavailable. Please try again shortly.");
  }

  const contactPath = `contacts/${encodeURIComponent(email)}`;
  try {
    let contact;
    try { contact = await brevo(contactPath); }
    catch (error) { if (!(error instanceof BrevoError) || error.status !== 404) throw error; }
    // Never undo existing unsubscribe or suppression settings.
    if (contact?.emailBlacklisted || contact?.attributes?.[CONFIRMED] === true) return success();
    await brevo("contacts", "POST", { email, listIds: [listId], updateEnabled: true });
    try {
      // Stable UUID-shaped key prevents concurrent submissions or network retries
      // from sending another confirmation within Brevo's idempotency window.
      const idempotencyKey = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
      await brevo("smtp/email", "POST", {
        sender: { name: "Pixely", email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email }],
        subject: "You’re on the list — Pixely",
        textContent: "You’re on the list.\n\nThanks for your interest in Pixely. We’ve received your request to join the waitlist. We’ll email you the moment your spot is ready.\n\nThe Pixely team",
        htmlContent: '<!doctype html><html lang="en"><body style="margin:0;background:#0a0a0b;color:#ece9e1;font-family:Arial,sans-serif"><div style="max-width:520px;margin:0 auto;padding:48px 24px"><p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#8c9bff">Pixely / Waitlist</p><h1 style="font-size:36px;line-height:1.1;font-weight:600">You’re on the list.</h1><p style="font-size:16px;line-height:1.7">Thanks for your interest in Pixely. We’ve received your request to join the waitlist.</p><p style="font-size:16px;line-height:1.7">We’ll email you the moment your spot is ready.</p><p style="margin-top:32px;border-top:1px solid #343436;padding-top:24px;font-size:13px">The Pixely team</p></div></body></html>',
        headers: { idempotencyKey },
        tags: ["pixely-waitlist"],
      });
    } catch (error) {
      if (!(error instanceof BrevoError) || error.code !== "duplicate_parameter") throw error;
    }
    await brevo(contactPath, "PUT", { attributes: { [CONFIRMED]: true } });
    return success();
  } catch (error) {
    // Provider messages may contain personal data; log only status/code.
    console.error("Waitlist signup failed", error instanceof BrevoError ? { status: error.status, code: error.code } : { code: "network_error" });
    return failure("We couldn’t finish your signup. Please try again in a moment.");
  }
}
