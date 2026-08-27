import {
  PROVIDERS,
  SESSION_COOKIE,
  type Provider,
  type SessionUser,
  bakeCookie,
  exchangeCode,
  readCookies,
  sealSession,
  siteOrigin,
  verifyIdToken,
} from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The return leg. Google comes back as a GET redirect; Apple as a cross-site
 * form POST — same pipeline once the parameters are in hand: check state,
 * trade the code, verify the id_token against the provider's keys, and only
 * then set a session.
 *
 * Every failure lands on the home page with ?auth=failed rather than a JSON
 * wall: the person mid-sign-in is a person, not a client.
 */
async function handle(
  request: Request,
  provider: Provider,
  params: { code?: string; state?: string; user?: string },
) {
  const origin = siteOrigin(request);
  const secure = origin.startsWith("https:");
  const fail = (why: string) =>
    new Response(null, {
      status: 303,
      headers: { Location: `${origin}/?auth=failed&why=${why}` },
    });

  const jar = readCookies(request);
  const state = jar[`oauth_state_${provider}`];
  const nonce = jar[`oauth_nonce_${provider}`];
  if (!params.code || !params.state || !state || params.state !== state)
    return fail("state");
  if (!nonce) return fail("nonce");

  const tokens = await exchangeCode(
    provider,
    origin,
    params.code,
    provider === "google" ? jar["oauth_pkce_google"] : undefined,
  ).catch(() => null);
  if (!tokens?.id_token) return fail("exchange");

  const claims = await verifyIdToken(provider, tokens.id_token, nonce).catch(
    () => null,
  );
  if (!claims) return fail("token");

  /* Apple sends the name once, on first consent, in a separate form field —
     the id_token never carries it. Take it while it exists. */
  let name = claims.name;
  if (!name && params.user) {
    try {
      const u = JSON.parse(params.user) as { name?: { firstName?: string; lastName?: string } };
      name = [u.name?.firstName, u.name?.lastName].filter(Boolean).join(" ") || undefined;
    } catch {
      /* the field is optional decoration */
    }
  }

  const user: SessionUser = { provider, sub: claims.sub, email: claims.email, name };
  const headers = new Headers({ Location: `${origin}/?auth=ok` });
  headers.append(
    "Set-Cookie",
    bakeCookie(SESSION_COOKIE, sealSession(user), {
      maxAge: 7 * 24 * 3600,
      secure,
    }),
  );
  /* The handshake cookies die with the handshake. */
  for (const spent of [`oauth_state_${provider}`, `oauth_nonce_${provider}`, "oauth_pkce_google"])
    headers.append(
      "Set-Cookie",
      bakeCookie(spent, "", { maxAge: 0, secure, crossSite: provider === "apple" }),
    );
  return new Response(null, { status: 303, headers });
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/auth/[provider]/callback">,
) {
  const { provider } = await ctx.params;
  if (!(PROVIDERS as string[]).includes(provider))
    return Response.json({ error: "unknown provider" }, { status: 404 });
  const url = new URL(request.url);
  return handle(request, provider as Provider, {
    code: url.searchParams.get("code") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
  });
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/auth/[provider]/callback">,
) {
  const { provider } = await ctx.params;
  if (!(PROVIDERS as string[]).includes(provider))
    return Response.json({ error: "unknown provider" }, { status: 404 });
  const form = await request.formData().catch(() => null);
  return handle(request, provider as Provider, {
    code: form?.get("code")?.toString(),
    state: form?.get("state")?.toString(),
    user: form?.get("user")?.toString(),
  });
}
