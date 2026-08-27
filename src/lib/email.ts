/**
 * Email verification, the part that is decidable without a network.
 *
 * What this can honestly tell you, and what it cannot, because the
 * difference is the whole value of the thing:
 *
 *   Syntax        Decidable here, exactly. Either the address is well formed
 *                 or it is not.
 *   Typo          Decidable here, as a suggestion. gmial.com is not invalid,
 *                 it is a domain nobody meant to type.
 *   Disposable    Decidable here, against a list. Lists go stale; this one
 *                 is a seed and wants a maintained feed behind it.
 *   Role address  Decidable here. info@ is real mail to a shared inbox, not
 *                 a person, and for a sign-up that is worth knowing.
 *   Domain        NOT decidable here. It needs DNS, which needs a server —
 *                 see the route handler.
 *   Mailbox       NOT decidable anywhere, reliably. See the note below.
 *
 * On mailboxes. The step past MX is an SMTP conversation with the receiving
 * server — RCPT TO and read the reply. It is deliberately not done here.
 * Most large providers accept every recipient at that stage and bounce
 * later, so the answer is usually "yes" and means nothing; the ones that do
 * answer honestly rate-limit and blacklist the asking address, so a verifier
 * that scales is a verifier that gets itself blocked. Anyone selling
 * mailbox-level certainty is selling bounce history they collected by
 * sending, which is data, not a technique.
 */

export type Verdict =
  | "ok"
  | "invalid"
  | "typo"
  | "disposable"
  | "role"
  | "unknown";

export type Check = {
  verdict: Verdict;
  /** One line, addressed to the person typing. */
  message: string;
  /** A domain they probably meant. */
  suggestion?: string;
  /** True when nothing further can be learned by asking a server. */
  final: boolean;
};

/* Practical RFC 5322: the subset real addresses use, without the quoted
   strings and comments that no sign-up form has ever needed and that every
   naive regex gets wrong anyway. */
const LOCAL = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const LABEL = /^[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

/* Seed list. Short on purpose — a long list here would read as coverage it
   does not have. Production wants a maintained feed; this catches the ones
   people actually reach for. */
const DISPOSABLE = new Set([
  "10minutemail.com", "guerrillamail.com", "mailinator.com", "yopmail.com",
  "tempmail.com", "temp-mail.org", "throwawaymail.com", "getnada.com",
  "trashmail.com", "sharklasers.com", "dispostable.com", "fakeinbox.com",
  "maildrop.cc", "mintemail.com", "mohmal.com", "spamgourmet.com",
  "emailondeck.com", "moakt.com", "tempr.email", "burnermail.io",
]);

/* Mail to a desk rather than a person. Not invalid, and for some products
   not even unwanted — but an account that belongs to whoever is on shift is
   worth flagging at the point it is created. */
const ROLE = new Set([
  "admin", "administrator", "abuse", "billing", "compliance", "contact",
  "help", "hello", "info", "legal", "mail", "marketing", "noreply",
  "no-reply", "office", "postmaster", "root", "sales", "security",
  "support", "team", "webmaster",
]);

/* Reserved by RFC 2606 and RFC 6761 so that documentation and tests have
   names that can never belong to anyone. They must never be accepted, and
   the DNS cannot be trusted to say so: example.com has address records and
   no MX, so the RFC 5321 fallback below would read it as a host that takes
   mail. It does not, and never will. */
const RESERVED_TLD = new Set(["test", "example", "invalid", "localhost"]);
const RESERVED_DOMAIN = new Set([
  "example.com",
  "example.net",
  "example.org",
]);

/* The domains a typo is worth checking against — the ones with enough share
   that a near miss is almost certainly a slip rather than a real host. */
const COMMON = [
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com",
  "yahoo.com", "yahoo.co.uk", "icloud.com", "me.com", "proton.me",
  "protonmail.com", "aol.com", "zoho.com", "yandex.com", "gmx.com",
  "mail.com", "qq.com", "naver.com",
];

/** Damerau-Levenshtein, capped: past two edits it is a different domain, not
 *  a typo, and there is no point counting further. */
function distance(a: string, b: string, cap = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  let prev2: number[] = [];
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let best = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      /* The transposition case — "gmial" is one swap from "gmail", and
         without this it costs two and falls outside the cap. */
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1] &&
        prev2.length
      ) {
        curr[j] = Math.min(curr[j], prev2[j - 2] + cost);
      }
      if (curr[j] < best) best = curr[j];
    }
    if (best > cap) return cap + 1;
    prev2 = prev.slice();
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** Split once at the last @, which is where the domain starts however many
 *  the local part contains. */
export function split(address: string) {
  const at = address.lastIndexOf("@");
  if (at < 1 || at === address.length - 1) return null;
  return { local: address.slice(0, at), domain: address.slice(at + 1) };
}

export function nearestDomain(domain: string): string | undefined {
  if (COMMON.includes(domain)) return undefined;
  let best: string | undefined;
  let bestAt = 3;
  for (const candidate of COMMON) {
    const d = distance(domain, candidate);
    if (d < bestAt) {
      bestAt = d;
      best = candidate;
    }
  }
  return bestAt <= 2 ? best : undefined;
}

/**
 * Everything decidable without asking anyone. Returns `final: true` when the
 * answer cannot improve — there is no point spending a DNS query on an
 * address that is not an address.
 */
export function inspect(raw: string): Check {
  const address = raw.trim();
  if (!address) return { verdict: "unknown", message: "", final: true };

  /* 254 is the longest an address may be in a message envelope; 64 is the
     longest local part. Both are worth checking before anything else,
     because everything after this assumes a sane length. */
  if (address.length > 254)
    return { verdict: "invalid", message: "That address is too long.", final: true };

  const parts = split(address);
  if (!parts)
    return {
      verdict: "invalid",
      message: "An address needs a name, an @, and a domain.",
      final: true,
    };

  const { local, domain } = parts;
  if (local.length > 64)
    return { verdict: "invalid", message: "The part before the @ is too long.", final: true };
  if (!LOCAL.test(local))
    return {
      verdict: "invalid",
      message: "The part before the @ has a character that cannot be there.",
      final: true,
    };

  const labels = domain.toLowerCase().split(".");
  if (labels.length < 2)
    return { verdict: "invalid", message: "The domain needs a dot in it.", final: true };
  if (domain.length > 253 || !labels.every((l) => LABEL.test(l)))
    return { verdict: "invalid", message: "That domain is not a valid one.", final: true };
  /* A TLD is letters. Numbers here mean someone typed an address into a
     field expecting a host. */
  if (!/^[A-Za-z]{2,}$/.test(labels[labels.length - 1]))
    return { verdict: "invalid", message: "That domain ending is not a real one.", final: true };

  const host = labels.join(".");

  if (RESERVED_TLD.has(labels[labels.length - 1]) || RESERVED_DOMAIN.has(host))
    return {
      verdict: "invalid",
      message: "That domain is reserved and cannot receive mail.",
      final: true,
    };

  const suggestion = nearestDomain(host);
  if (suggestion)
    return {
      verdict: "typo",
      message: `Did you mean ${local}@${suggestion}?`,
      suggestion: `${local}@${suggestion}`,
      final: true,
    };

  if (DISPOSABLE.has(host))
    return {
      verdict: "disposable",
      message: "That is a throwaway address. Use one you can be reached at.",
      final: true,
    };

  if (ROLE.has(local.toLowerCase()))
    return {
      verdict: "role",
      message: "That is a shared inbox. It works, but it belongs to a desk.",
      final: false,
    };

  /* Well formed and unremarkable — which is as far as anything here can see.
     Whether the domain takes mail is the server's question. */
  return { verdict: "ok", message: "", final: false };
}
