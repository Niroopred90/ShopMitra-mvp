import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signupCallbackUrl } from "@/lib/owner-signup";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  let confirmed = false;
  if (code && code.length <= 4096) {
    try {
      const client = await createClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      confirmed = !error;
    } catch { /* Do not log confirmation codes or provider responses. */ }
  }
  // Fixed destinations: an untrusted next/redirect parameter cannot leave the app.
  const response = NextResponse.redirect(new URL(confirmed ? "/owner/onboarding" : "/owner/login?error=confirmation", signupCallbackUrl() ?? request.url));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
