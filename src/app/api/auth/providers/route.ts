import { configured } from "@/lib/oauth";

/** Which connectors are live. The dialog asks before it navigates, so an
 *  unconfigured button can say so honestly instead of bouncing off a 503. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    google: configured("google"),
    apple: configured("apple"),
  });
}
