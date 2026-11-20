import { createHash, randomBytes } from "node:crypto";

import { CONTACT_INBOX } from "@/lib/company";
import { TOPICS, type TopicId } from "@/lib/contact";

export const runtime = "nodejs";

/**
 * The contact form's delivery. The message is emailed to Pixely's inbox
 * through Brevo's transactional API, with the sender as reply-to, so
 * answering it is pressing Reply; the sender then gets a short confirmation
 * carrying the same reference. Nothing is stored here: the inbox is the
 * record.
 *
 * The inbox delivery is the one that matters. If it fails, the visitor is
 * told and can try again; if only the confirmation fails, the message has
 * still arrived, so that is a success with no receipt rather than an error
 * that invites a duplicate.
 */

const fail = (error: string, status = 400, field?: string) =>
  Response.json({ error, ...(field ? { field } : {}) }, { status });

/* Best-effort, per-instance throttling, as the earlier waitlist route kept
   it. Counters reset within ten minutes and are never written anywhere; a
   deployment across instances should add a shared limit at the edge. */
const WINDOW = 10 * 60_000;
const attempts = new Map<string, { count: number; until: number }>();
function limited(key: string, max: number) {
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
  if (attempts.size >= 5000 && !attempts.has(key)) return true;
  const entry = attempts.get(key) ?? { count: 0, until: now + WINDOW };
  entry.count++;
  attempts.set(key, entry);
  return entry.count > max;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function brevo(body: unknown) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw Object.assign(new Error("Brevo request failed"), { status: response.status, code: data.code || "unknown" });
  }
}

/** One page of the house email: ink ground, mono label, plain type. */
const page = (label: string, title: string, rows: string) =>
  `<!doctype html><html lang="en"><body style="margin:0;background:#0a0a0b;color:#ece9e1;font-family:Arial,sans-serif">` +
  `<div style="max-width:560px;margin:0 auto;padding:44px 24px">` +
  `<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8c9bff;margin:0 0 18px">${label}</p>` +
  `<h1 style="font-size:28px;line-height:1.15;font-weight:600;margin:0 0 24px">${title}</h1>${rows}` +
  `<p style="margin-top:36px;border-top:1px solid #2a2a2e;padding-top:20px;font-size:12px;color:#8a8a90">Pixely · SARL PIXELY, Algiers</p>` +
  `</div></body></html>`;

const row = (k: string, v: string) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.6"><span style="display:block;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8a90">${k}</span>${v}</p>`;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.AUTH_URL ? new URL(process.env.AUTH_URL).origin : new URL(request.url).origin;
  if (origin && origin !== expected) return fail("Please write to us from the Pixely website.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return fail("Invalid request.", 415);

  // Read a bounded stream rather than trusting a client-supplied Content-Length.
  let body: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return fail("Invalid request.");
    const chunks: Uint8Array[] = [];
    let length = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 16_384) {
        await reader.cancel();
        return fail("That message is too long to send.", 413);
      }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return fail("Invalid request.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Invalid request.");

  // The honeypot: a field no person sees. Filled in, it is a bot, and it is
  // told it succeeded so it has no reason to try again.
  if (body.website) return Response.json({ ok: true, reference: "PX-000000" });

  const text = (k: string, max: number) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max + 1) : "");
  const name = text("name", 120);
  const email = text("email", 254).toLowerCase();
  const company = text("company", 160);
  const country = text("country", 60);
  const topic = text("topic", 40) as TopicId;
  const message = text("message", 4000);

  if (!name || name.length > 120) return fail("Please tell us your name.", 400, "name");
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
    return fail("Please enter a valid email address.", 400, "email");
  }
  if (company.length > 160) return fail("That company name is too long.", 400, "company");
  if (!country || country.length > 60) return fail("Please choose your country.", 400, "country");
  const subject = TOPICS.find((t) => t.id === topic);
  if (!subject) return fail("Please choose what it's about.", 400, "topic");
  if (message.length < 20) return fail("Please tell us a little more — a sentence or two.", 400, "message");
  if (message.length > 4000) return fail("Please keep it under 4,000 characters.", 400, "message");

  const hash = createHash("sha256").update(email).digest("hex");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(`ip:${ip}`, 6) || limited(`email:${hash}`, 3)) {
    return fail("You've sent a few messages already. Please try again in a few minutes.", 429);
  }

  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    return fail("The form is unavailable right now. Please email us directly.", 503);
  }

  const reference = `PX-${randomBytes(3).toString("hex").toUpperCase()}`;
  const sender = { name: "Pixely", email: process.env.BREVO_SENDER_EMAIL };
  const inbox = process.env.CONTACT_INBOX || CONTACT_INBOX;
  const paragraphs = escape(message).replace(/\n/g, "<br>");

  try {
    await brevo({
      sender,
      to: [{ email: inbox, name: "Pixely" }],
      replyTo: { email, name },
      subject: `${subject.label} — ${name}${company ? `, ${company}` : ""} · ${reference}`,
      htmlContent: page(
        `Contact · ${escape(subject.label)}`,
        escape(name) + (company ? ` <span style="color:#8a8a90">· ${escape(company)}</span>` : ""),
        row("Email", `<a style="color:#9fb4ff" href="mailto:${escape(email)}">${escape(email)}</a>`) +
          row("Country", escape(country)) +
          row("Topic", escape(subject.label)) +
          row("Message", paragraphs) +
          row("Reference", reference),
      ),
      textContent: `${subject.label}\n\nFrom: ${name} <${email}>\nCompany: ${company || "—"}\nCountry: ${country}\nReference: ${reference}\n\n${message}\n`,
      tags: ["pixely-contact", topic],
    });
  } catch (error) {
    // Provider messages can echo personal data; log only status and code.
    const e = error as { status?: number; code?: string };
    console.error("Contact delivery failed", { status: e.status ?? 0, code: e.code ?? "network_error" });
    return fail("We couldn't send your message just now. Please try again in a moment.", 503);
  }

  try {
    await brevo({
      sender,
      to: [{ email, name }],
      subject: `We have your message — Pixely · ${reference}`,
      htmlContent: page(
        "Pixely / Contact",
        `Thank you, ${escape(name.split(" ")[0])}.`,
        row("", "Your message reached us, and someone from the team will reply to this address.") +
          row("Topic", escape(subject.label)) +
          row("Reference", reference),
      ),
      textContent: `Thank you, ${name.split(" ")[0]}.\n\nYour message reached us, and someone from the team will reply to this address.\n\nTopic: ${subject.label}\nReference: ${reference}\n\nPixely`,
      tags: ["pixely-contact-receipt"],
    });
  } catch (error) {
    const e = error as { status?: number; code?: string };
    console.error("Contact receipt failed", { status: e.status ?? 0, code: e.code ?? "network_error" });
  }

  return Response.json({ ok: true, reference });
}
