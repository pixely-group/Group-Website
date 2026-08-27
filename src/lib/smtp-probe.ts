import net from "node:net";
import dns from "node:dns/promises";

/**
 * The mailbox probe: an SMTP conversation that stops one word short of
 * sending. Built here rather than bought — it is about forty lines of the
 * protocol — but built with its limits on the label, because they are the
 * whole story.
 *
 * The conversation is the one a real sender opens:
 *
 *     (connect to the domain's lowest-priority MX, port 25)
 *     < 220 mx.example.com ESMTP
 *     > EHLO  <our helo name>
 *     < 250 ...
 *     > MAIL FROM:<probe@our-domain>
 *     < 250 OK
 *     > RCPT TO:<the address under test>
 *     < 250 OK        -> the mailbox exists
 *     < 550 ...       -> it does not
 *     > RSET / QUIT   (never DATA — nothing is ever sent)
 *
 * Three things make this a supplement and never the whole answer, and all
 * three are why a bought list exists at all:
 *
 *  1. Port 25 outbound is blocked on essentially every cloud host — AWS,
 *     GCP, Vercel, Cloudflare — to stop spam. Measured from this machine it
 *     is refused outright. So in most deployments every probe times out, and
 *     "unknown" is the honest result, not "bad".
 *
 *  2. The large providers defeat it on purpose. Gmail and Outlook accept
 *     RCPT TO for every address to deny spammers exactly this enumeration,
 *     then bounce afterwards — so they answer "yes" to a dead mailbox. The
 *     accept-all responders are skipped rather than believed.
 *
 *  3. Probing is itself abusive at scale. A server that answers honestly
 *     greylists and then blocks the IP that keeps opening RCPT and hanging
 *     up. So this is gated, rate-limited, and never a thing to run on a
 *     keystroke.
 *
 * Where it works — a company's own Postfix, a small host that answers
 * straight — it upgrades a real "accepts mail" into a real "the mailbox is
 * there". Where it cannot, it says so and the passwordless link remains the
 * verification that actually counts.
 */

export type Mailbox = "exists" | "absent" | "accepts-all" | "unknown";

const PORT = 25;
const CONNECT_MS = 4000;
const STEP_MS = 4000;

/** Who we announce ourselves as. A probe from a name that does not resolve
 *  is refused by anything strict, so this wants a real domain in production;
 *  it is read from the environment so nothing is hardcoded to one host. */
const HELO = process.env.SMTP_PROBE_HELO ?? "pixely.com";
const MAIL_FROM = process.env.SMTP_PROBE_FROM ?? `probe@${HELO}`;

/** A pair of addresses at the domain that cannot both exist: if the server
 *  accepts an obvious nonsense mailbox, it accepts everything, and its answer
 *  about the real one is worthless. */
function catchAllProbe(domain: string) {
  return `no-such-user-${Date.now().toString(36)}@${domain}`;
}

type Conn = {
  write: (line: string) => Promise<string>;
  end: () => void;
};

function open(host: string): Promise<Conn | null> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port: PORT });
    let buffer = "";
    let waiting: ((reply: string) => void) | null = null;
    let settled = false;

    const fail = () => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(null);
    };

    socket.setTimeout(CONNECT_MS);
    socket.on("timeout", fail);
    socket.on("error", fail);

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      /* A reply is complete when its last line's code is not followed by a
         hyphen — "250-" continues, "250 " ends. */
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1];
      if (last && /^\d{3} /.test(last) && waiting) {
        const reply = buffer;
        buffer = "";
        const resume = waiting;
        waiting = null;
        resume(reply);
      }
    });

    /* The greeting arrives unbidden; the connection is ready once it does. */
    socket.once("data", () => {
      if (settled) return;
      settled = true;
      socket.setTimeout(STEP_MS);
      resolve({
        write: (line) =>
          new Promise<string>((res, rej) => {
            waiting = res;
            socket.once("timeout", () => rej(new Error("timeout")));
            socket.once("error", rej);
            socket.write(line + "\r\n");
          }),
        end: () => {
          try {
            socket.write("QUIT\r\n");
          } catch {
            /* closing anyway */
          }
          socket.destroy();
        },
      });
    });
  });
}

const code = (reply: string) => Number.parseInt(reply.slice(0, 3), 10);

/**
 * Ask a domain's mail server whether one mailbox exists, without sending.
 * Returns `unknown` for every case where the answer cannot be trusted —
 * which, in a blocked-port-25 deployment, is all of them.
 */
export async function probeMailbox(
  address: string,
  domain: string,
): Promise<Mailbox> {
  let mx: { exchange: string; priority: number }[];
  try {
    mx = await dns.resolveMx(domain);
  } catch {
    return "unknown";
  }
  const host = mx
    .filter((r) => r.exchange && r.exchange !== ".")
    .sort((a, b) => a.priority - b.priority)[0]?.exchange;
  if (!host) return "unknown";

  const conn = await open(host);
  if (!conn) return "unknown"; // port blocked, or the host would not talk

  try {
    const ehlo = await conn.write(`EHLO ${HELO}`);
    if (code(ehlo) !== 250) return "unknown";

    const from = await conn.write(`MAIL FROM:<${MAIL_FROM}>`);
    if (code(from) !== 250) return "unknown";

    /* The decoy first. If the server accepts a mailbox that cannot exist, it
       is an accept-all and its verdict on the real address means nothing. */
    const decoy = await conn.write(`RCPT TO:<${catchAllProbe(domain)}>`);
    if (code(decoy) === 250) return "accepts-all";

    const real = await conn.write(`RCPT TO:<${address}>`);
    const c = code(real);
    /* 250/251 accept the recipient; 550/551/553 reject a missing one; a
       4xx is a temporary refusal — greylisting, load — and not an answer. */
    if (c === 250 || c === 251) return "exists";
    if (c === 550 || c === 551 || c === 553) return "absent";
    return "unknown";
  } catch {
    return "unknown";
  } finally {
    conn.end();
  }
}
