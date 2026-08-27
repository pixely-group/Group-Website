import { SESSION_COOKIE, bakeCookie, siteOrigin } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST, not GET: signing out changes state, and a GET that changes state is
 *  a link that logs people out when prefetched. */
export async function POST(request: Request) {
  const secure = siteOrigin(request).startsWith("https:");
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": bakeCookie(SESSION_COOKIE, "", { maxAge: 0, secure }),
    },
  });
}
