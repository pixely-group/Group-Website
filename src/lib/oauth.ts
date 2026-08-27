import crypto from "node:crypto";

/**
 * Sign-in with Google and Apple, hand-rolled the way the verifier and the
 * probe were: the protocol is small enough to own, and owning it means the
 * failure modes are all named here rather than inside a dependency.
 *
 * The flow is the standard authorization code dance:
 *
 *   /api/auth/<p>/start     303 → the provider's consent page, carrying
 *                           `state` (CSRF), `nonce` (token replay) and — for
 *                           Google — a PKCE challenge, each mirrored in a
 *                           short-lived cookie.
 *   /api/auth/<p>/callback  the provider returns a one-time code; it is
 *                           exchanged server-side for an id_token, which is
 *                           verified against the provider's published JWKS
 *                           (signature, issuer, audience, expiry, nonce)
 *                           before a session cookie is set.
 *
 * Two provider quirks are load-bearing:
 *
 *   - Apple posts the callback (`response_mode=form_post`, required once
 *     name/email scopes are asked for). A cross-site POST only carries
 *     cookies marked SameSite=None; Secure — so Apple's state cookies are,
 *     which also means Apple sign-in only works over https. Apple does not
 *     allow http://localhost as a return URL anyway.
 *   - Apple has no static client secret. It is minted per request: an ES256
 *     JWT signed with the .p8 key from the developer portal.
 *
 * Sessions are a signed cookie, not a database row: profile JSON plus an
 * HMAC. Enough to know who is signed in; nothing here pretends to be an
 * account system.
 */

export type Provider = "google" | "apple";

export const PROVIDERS: Provider[] = ["google", "apple"];

const ENDPOINTS = {
  google: {
    auth: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    jwks: "https://www.googleapis.com/oauth2/v3/certs",
    issuers: ["https://accounts.google.com", "accounts.google.com"],
    scope: "openid email profile",
  },
  apple: {
    auth: "https://appleid.apple.com/auth/authorize",
    token: "https://appleid.apple.com/auth/token",
    jwks: "https://appleid.apple.com/auth/keys",
    issuers: ["https://appleid.apple.com"],
    scope: "name email",
  },
} as const;

/* ——— configuration ————————————————————————————————————— */

export function googleConfig() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  return id && secret ? { id, secret } : null;
}

export function appleConfig() {
  const id = process.env.APPLE_CLIENT_ID; // the Services ID
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const key = process.env.APPLE_PRIVATE_KEY; // the .p8, PEM text
  return id && teamId && keyId && key ? { id, teamId, keyId, key } : null;
}

export function configured(provider: Provider): boolean {
  return provider === "google" ? !!googleConfig() : !!appleConfig();
}

/** The site's own canonical origin. Behind a proxy the request's host is the
 *  proxy's, so production sets AUTH_URL; in dev the request origin is right. */
export function siteOrigin(request: Request): string {
  return process.env.AUTH_URL ?? new URL(request.url).origin;
}

export const redirectUri = (origin: string, provider: Provider) =>
  `${origin}/api/auth/${provider}/callback`;

/* ——— small pieces ———————————————————————————————————————— */

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString("base64url");

export const randomToken = () => b64url(crypto.randomBytes(24));

export const pkceChallenge = (verifier: string) =>
  b64url(crypto.createHash("sha256").update(verifier).digest());

/** Session signing secret. Generated per boot when unset — dev sessions die
 *  on restart, which is the correct nudge to set AUTH_SECRET in production. */
const bootSecret = crypto.randomBytes(32).toString("base64url");
const secret = () => process.env.AUTH_SECRET ?? bootSecret;

/* ——— the session cookie ————————————————————————————————— */

export type SessionUser = {
  provider: Provider;
  sub: string;
  email?: string;
  name?: string;
};

export const SESSION_COOKIE = "pixely_session";

export function sealSession(user: SessionUser): string {
  const body = b64url(JSON.stringify({ ...user, iat: Date.now() }));
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function openSession(sealed: string | undefined): SessionUser | null {
  if (!sealed) return null;
  const dot = sealed.lastIndexOf(".");
  if (dot < 1) return null;
  const body = sealed.slice(0, dot);
  const mac = sealed.slice(dot + 1);
  const expect = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof parsed?.sub !== "string") return null;
    return parsed as SessionUser;
  } catch {
    return null;
  }
}

/* ——— cookies, by hand ————————————————————————————————————
   The handshake cookies live ten minutes and die on use. Apple's must be
   SameSite=None (its callback is a cross-site POST, and Lax cookies stay
   home); None requires Secure, which https provides where Apple works at
   all. */

export function bakeCookie(
  name: string,
  value: string,
  { maxAge, crossSite, secure }: { maxAge: number; crossSite?: boolean; secure: boolean },
): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${maxAge}`,
    crossSite ? "SameSite=None" : "SameSite=Lax",
  ];
  if (secure || crossSite) parts.push("Secure");
  return parts.join("; ");
}

export function readCookies(request: Request): Record<string, string> {
  const jar: Record<string, string> = {};
  for (const pair of (request.headers.get("cookie") ?? "").split(/;\s*/)) {
    const eq = pair.indexOf("=");
    if (eq > 0) jar[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return jar;
}

/* ——— Apple's per-request client secret ————————————————————— */

export function appleClientSecret(): string {
  const apple = appleConfig();
  if (!apple) throw new Error("apple not configured");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "ES256", kid: apple.keyId }));
  const payload = b64url(
    JSON.stringify({
      iss: apple.teamId,
      iat: now,
      exp: now + 300,
      aud: "https://appleid.apple.com",
      sub: apple.id,
    }),
  );
  /* JOSE wants the raw r||s signature, not DER — that is what ieee-p1363
     asks for, and getting this wrong is the classic invalid_client. */
  const signature = crypto.sign("sha256", Buffer.from(`${header}.${payload}`), {
    key: crypto.createPrivateKey(apple.key.replace(/\\n/g, "\n")),
    dsaEncoding: "ieee-p1363",
  });
  return `${header}.${payload}.${b64url(signature)}`;
}

/* ——— the consent URL ————————————————————————————————————— */

export function authStartUrl(
  provider: Provider,
  origin: string,
  { state, nonce, challenge }: { state: string; nonce: string; challenge?: string },
): string {
  const spec = ENDPOINTS[provider];
  const url = new URL(spec.auth);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri(origin, provider));
  url.searchParams.set("scope", spec.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  if (provider === "google") {
    url.searchParams.set("client_id", googleConfig()!.id);
    if (challenge) {
      url.searchParams.set("code_challenge", challenge);
      url.searchParams.set("code_challenge_method", "S256");
    }
  } else {
    url.searchParams.set("client_id", appleConfig()!.id);
    /* Required the moment name or email is in scope. */
    url.searchParams.set("response_mode", "form_post");
  }
  return url.toString();
}

/* ——— code → tokens ————————————————————————————————————— */

export async function exchangeCode(
  provider: Provider,
  origin: string,
  code: string,
  verifier?: string,
): Promise<{ id_token?: string } | null> {
  const spec = ENDPOINTS[provider];
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(origin, provider),
  });
  if (provider === "google") {
    const g = googleConfig()!;
    body.set("client_id", g.id);
    body.set("client_secret", g.secret);
    if (verifier) body.set("code_verifier", verifier);
  } else {
    body.set("client_id", appleConfig()!.id);
    body.set("client_secret", appleClientSecret());
  }
  const res = await fetch(spec.token, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  return (await res.json()) as { id_token?: string };
}

/* ——— id_token verification ————————————————————————————————
   The token is checked against the provider's published keys, not merely
   decoded: signature, issuer, audience, expiry, and the nonce minted at the
   start of this very handshake. Skipping any of these is how "sign in with"
   becomes "type any name in". */

type Jwk = { kid: string; [k: string]: unknown };
const jwksCache = new Map<Provider, { keys: Jwk[]; at: number }>();
const JWKS_TTL = 6 * 60 * 60 * 1000;

async function jwks(provider: Provider): Promise<Jwk[]> {
  const hit = jwksCache.get(provider);
  if (hit && Date.now() - hit.at < JWKS_TTL) return hit.keys;
  const res = await fetch(ENDPOINTS[provider].jwks);
  if (!res.ok) throw new Error("jwks unavailable");
  const { keys } = (await res.json()) as { keys: Jwk[] };
  jwksCache.set(provider, { keys, at: Date.now() });
  return keys;
}

export async function verifyIdToken(
  provider: Provider,
  idToken: string,
  expectedNonce: string,
): Promise<{ sub: string; email?: string; name?: string } | null> {
  const [h, p, s] = idToken.split(".");
  if (!h || !p || !s) return null;
  let header: { kid?: string; alg?: string };
  let claims: {
    iss?: string;
    aud?: string;
    exp?: number;
    nonce?: string;
    sub?: string;
    email?: string;
    name?: string;
    given_name?: string;
  };
  try {
    header = JSON.parse(Buffer.from(h, "base64url").toString("utf8"));
    claims = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (header.alg !== "RS256") return null;

  const key = (await jwks(provider)).find((k) => k.kid === header.kid);
  if (!key) return null;
  const valid = crypto.verify(
    "RSA-SHA256",
    Buffer.from(`${h}.${p}`),
    crypto.createPublicKey({ key: key as crypto.JsonWebKey, format: "jwk" }),
    Buffer.from(s, "base64url"),
  );
  if (!valid) return null;

  const spec = ENDPOINTS[provider];
  const clientId = provider === "google" ? googleConfig()?.id : appleConfig()?.id;
  if (!claims.iss || !(spec.issuers as readonly string[]).includes(claims.iss)) return null;
  if (!clientId || claims.aud !== clientId) return null;
  if (!claims.exp || claims.exp * 1000 < Date.now()) return null;
  if (claims.nonce !== expectedNonce) return null;
  if (!claims.sub) return null;

  return {
    sub: claims.sub,
    email: claims.email,
    name: claims.name ?? claims.given_name,
  };
}
