import dns from "node:dns/promises";

import { inspect, split, type Check } from "@/lib/email";

/**
 * The half of verification that needs a network.
 *
 * Node runtime, not edge: this needs a real DNS resolver, and the edge
 * runtime has no `node:dns`. Dynamic, because the answer depends on the
 * request and on the world.
 *
 * Fast is mostly a matter of not asking twice. A domain's MX records change
 * on the order of months, so the second person to sign up from a given
 * company costs nothing, and gmail.com is answered from memory forever. The
 * cache is per-instance, which is the right shape for this: it is a pure
 * function of a domain, so instances disagreeing costs nothing and there is
 * nothing to invalidate across them. In front of many instances the resolver
 * itself is the next cache down.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** MX records outlive a session comfortably. An hour is short enough that a
 *  domain that has just set up mail is not wrong for long. */
const TTL_MS = 60 * 60 * 1000;
/** A resolver that has not answered in this long is not going to make the
 *  form feel fast, and a slow answer is worse than an honest "unknown". */
const DNS_TIMEOUT_MS = 1500;
/** Bounded, so a flood of unique domains cannot grow this without limit.
 *  Oldest out first, which for this access pattern is close enough to LRU. */
const CACHE_MAX = 5000;

type Domain = { mail: boolean; at: number };
const domains = new Map<string, Domain>();

function remember(domain: string, mail: boolean) {
  if (domains.size >= CACHE_MAX) {
    const oldest = domains.keys().next().value;
    if (oldest) domains.delete(oldest);
  }
  domains.set(domain, { mail, at: Date.now() });
}

async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | null> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Does this domain accept mail at all?
 *
 * MX first. Falling back to A/AAAA is not a nicety — RFC 5321 says a domain
 * with an address record and no MX takes mail at that host, and small
 * self-hosted domains still rely on it. Treating "no MX" as undeliverable
 * would reject them, and rejecting a real customer is a far worse failure
 * here than admitting a dead one.
 */
async function acceptsMail(domain: string): Promise<boolean | null> {
  const hit = domains.get(domain);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.mail;

  const mx = await withTimeout(
    dns.resolveMx(domain).catch(() => [] as { exchange: string }[]),
    DNS_TIMEOUT_MS,
  );
  if (mx === null) return null; // timed out — say so rather than guess
  /* A single "." exchange is a domain declaring it takes no mail at all,
     which is a real answer and a negative one. */
  const usable = mx.filter((r) => r.exchange && r.exchange !== ".");
  if (usable.length) {
    remember(domain, true);
    return true;
  }

  const a = await withTimeout(
    Promise.any([dns.resolve4(domain), dns.resolve6(domain)]).catch(() => []),
    DNS_TIMEOUT_MS,
  );
  if (a === null) return null;
  const mail = Array.isArray(a) && a.length > 0;
  remember(domain, mail);
  return mail;
}

export async function POST(request: Request) {
  let address = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    address = typeof body.email === "string" ? body.email : "";
  } catch {
    return Response.json(
      { verdict: "invalid", message: "No address given.", final: true } satisfies Check,
      { status: 400 },
    );
  }

  /* Everything decidable without the network, first — a malformed address
     should never cost a DNS query. */
  const local = inspect(address);
  if (local.final) return Response.json(local);

  const parts = split(address.trim());
  if (!parts) return Response.json(local);
  const domain = parts.domain.toLowerCase();

  const mail = await acceptsMail(domain);

  if (mail === null)
    return Response.json({
      verdict: "unknown",
      message: "Could not reach the domain just now. You can carry on.",
      final: false,
    } satisfies Check);

  if (!mail)
    return Response.json({
      verdict: "invalid",
      message: `${domain} does not accept mail.`,
      final: true,
    } satisfies Check);

  /* Carry a role-address finding through rather than overwriting it: the
     domain taking mail does not stop info@ being a desk. */
  if (local.verdict === "role") return Response.json(local);

  return Response.json({
    verdict: "ok",
    /* Deliberately not "deliverable". The domain takes mail; whether this
       mailbox exists is the one thing nothing here can see. */
    message: `${domain} accepts mail.`,
    final: false,
  } satisfies Check);
}
