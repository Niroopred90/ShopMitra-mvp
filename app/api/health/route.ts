import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/supabase/config";
import { logOperationalEvent } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = supabaseConfig();
  let healthy = false;
  if (config) {
    try {
      const client = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error } = await client.from("public_shops").select("id").limit(1).abortSignal(AbortSignal.timeout(3000));
      healthy = !error;
    } catch { /* Return no provider or connection details. */ }
  }
  if (!healthy) logOperationalEvent("health_read_failed");
  return Response.json({ status: healthy ? "ok" : "unavailable" }, {
    status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" },
  });
}
