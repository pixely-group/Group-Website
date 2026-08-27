import {
  PROVIDERS,
  type Provider,
  authStartUrl,
  bakeCookie,
  configured,
  pkceChallenge,
  randomToken,
  siteOrigin,
} from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The first leg: mint the handshake secrets, mirror them in cookies, and
 * hand the browser to the provider's consent page.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/auth/[provider]/start">,
) {
  const { provider: raw } = await ctx.params;
  if (!(PROVIDERS as string[]).includes(raw))
    return Response.json({ error: "unknown provider" }, { status: 404 });
  const provider = raw as Provider;

  if (!configured(provider))
    return Response.json(
      {
        error: "not configured",
        need:
          provider === "google"
            ? ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]
            : ["APPLE_CLIENT_ID", "APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY"],
      },
      { status: 503 },
    );

  const origin = siteOrigin(request);
  const secure = origin.startsWith("https:");
  const state = randomToken();
  const nonce = randomToken();
  const verifier = provider === "google" ? randomToken() : undefined;

  const url = authStartUrl(provider, origin, {
    state,
    nonce,
    challenge: verifier ? pkceChallenge(verifier) : undefined,
  });

  const headers = new Headers({ Location: url });
  /* Apple's callback is a cross-site POST; only None-cookies ride along. */
  const crossSite = provider === "apple";
  const opts = { maxAge: 600, secure, crossSite };
  headers.append("Set-Cookie", bakeCookie(`oauth_state_${provider}`, state, opts));
  headers.append("Set-Cookie", bakeCookie(`oauth_nonce_${provider}`, nonce, opts));
  if (verifier)
    headers.append("Set-Cookie", bakeCookie("oauth_pkce_google", verifier, opts));
  return new Response(null, { status: 303, headers });
}
