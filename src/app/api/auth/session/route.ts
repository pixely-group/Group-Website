import { SESSION_COOKIE, openSession, readCookies } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Who is signed in, if anyone. The navigation asks once on load. */
export async function GET(request: Request) {
  const user = openSession(readCookies(request)[SESSION_COOKIE]);
  return Response.json({
    user: user
      ? { provider: user.provider, email: user.email, name: user.name }
      : null,
  });
}
