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

/* The mail hosts throwaway providers actually run. A provider spins up new
   domains far faster than any list is maintained — but they all point at the
   same handful of exchanges, and that is the part that does not change. So
   the domain list catches the known ones and this catches the rest, which is
   the only way to be strict about it without pretending a list is complete.

   Matched on the exchange's own domain, so a subdomain of one of these is
   caught too. */
const DISPOSABLE_MX = [
  "mailinator.com", "guerrillamail.com", "yopmail.com", "trashmail.com",
  "mailnesia.com", "temp-mail.org", "dropmail.me", "10minutemail.com",
  "mail.tm", "maildrop.cc", "mailsac.com", "moakt.com", "sharklasers.com",
  "spamgourmet.com", "throwawaymail.com", "inboxkitten.com", "duck.com",
];

function disposableExchange(hosts: string[]): boolean {
  return hosts.some((raw) => {
    const host = raw.replace(/\.$/, "").toLowerCase();
    return DISPOSABLE_MX.some(
      (bad) => host === bad || host.endsWith(`.${bad}`),
    );
  });
}

type Answer = { registered: boolean; mail: boolean; disposable: boolean };
type Domain = Answer & { at: number };
const domains = new Map<string, Domain>();

function remember(domain: string, answer: Answer) {
  if (domains.size >= CACHE_MAX) {
    const oldest = domains.keys().next().value;
    if (oldest) domains.delete(oldest);
  }
  domains.set(domain, { ...answer, at: Date.now() });
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
 * Is this domain registered, does it accept mail, and is it a throwaway?
 *
 * MX first. Falling back to A/AAAA is not a nicety — RFC 5321 says a domain
 * with an address record and no MX takes mail at that host, and small
 * self-hosted domains still rely on it. Treating "no MX" as undeliverable
 * would reject them, and rejecting a real customer is a far worse failure
 * here than admitting a dead one.
 *
 * Registration is read from the failure mode rather than looked up
 * separately: NXDOMAIN — Node's ENOTFOUND — means the name does not exist at
 * all, where ENODATA means it exists and simply has no records of that kind.
 * An address at an unregistered domain cannot exist, and "not registered" is
 * a more useful answer than "does not accept mail".
 */
async function lookUp(domain: string): Promise<Answer | null> {
  const hit = domains.get(domain);
  if (hit && Date.now() - hit.at < TTL_MS)
    return {
      registered: hit.registered,
      mail: hit.mail,
      disposable: hit.disposable,
    };

  const mx = await withTimeout(
    dns.resolveMx(domain).then(
      (records) => ({ records, missing: false }),
      (e: NodeJS.ErrnoException) => ({
        records: [] as { exchange: string }[],
        missing: e?.code === "ENOTFOUND",
      }),
    ),
    DNS_TIMEOUT_MS,
  );
  if (mx === null) return null; // timed out — say so rather than guess

  /* A single "." exchange is a domain declaring it takes no mail at all,
     which is a real answer and a negative one. */
  const usable = mx.records.filter((r) => r.exchange && r.exchange !== ".");
  if (usable.length) {
    const answer = {
      registered: true,
      mail: true,
      disposable: disposableExchange(usable.map((r) => r.exchange)),
    };
    remember(domain, answer);
    return answer;
  }

  const a = await withTimeout(
    Promise.any([dns.resolve4(domain), dns.resolve6(domain)]).then(
      (records) => ({ records, missing: false }),
      (err: AggregateError) => ({
        records: [] as string[],
        missing:
          err?.errors?.every(
            (e) => (e as NodeJS.ErrnoException)?.code === "ENOTFOUND",
          ) ?? false,
      }),
    ),
    DNS_TIMEOUT_MS,
  );
  if (a === null) return null;

  const answer = {
    /* Unregistered only when every query said the name itself does not
       exist — a lookup that failed any other way is a domain with problems,
       not a domain that is not there. */
    registered: !(mx.missing && a.missing),
    mail: a.records.length > 0,
    disposable: false,
  };
  remember(domain, answer);
  return answer;
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

  const found = await lookUp(domain);

  if (found === null)
    return Response.json({
      verdict: "unknown",
      message: "Could not reach the domain just now. You can carry on.",
      final: false,
    } satisfies Check);

  if (!found.registered)
    return Response.json({
      verdict: "invalid",
      message: `${domain} is not a registered domain.`,
      final: true,
    } satisfies Check);

  if (!found.mail)
    return Response.json({
      verdict: "invalid",
      message: `${domain} is registered but does not accept mail.`,
      final: true,
    } satisfies Check);

  /* Caught by the company it keeps rather than by name — this is the half of
     throwaway detection a list cannot do. */
  if (found.disposable)
    return Response.json({
      verdict: "disposable",
      message: "That is a throwaway address. Use one you can be reached at.",
      final: true,
    } satisfies Check);

  /* Carry a role-address finding through rather than overwriting it: the
     domain taking mail does not stop info@ being a desk. */
  if (local.verdict === "role") return Response.json(local);

  return Response.json({
    verdict: "ok",
    /* Deliberately not "verified". The domain takes mail; whether this
       exact mailbox exists is the one thing no lookup can see, and the link
       we send is what settles it — an address that cannot receive the link
       never becomes an account. */
    message: `${domain} accepts mail. The link we send confirms the inbox.`,
    final: false,
  } satisfies Check);
}
