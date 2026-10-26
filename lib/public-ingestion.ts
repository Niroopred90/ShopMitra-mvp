import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { supabaseConfig } from "@/lib/supabase/config";

export function ingestionClient() {
  const config = supabaseConfig();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!config || !key) return null;
  return createClient<Database>(config.url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(6000) }) },
  });
}

export async function publicRateKey() {
  const secret = process.env.PUBLIC_RATE_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Public reporting is unavailable");
  const trustedHeader = process.env.TRUSTED_CLIENT_IP_HEADER;
  // Never trust arbitrary x-forwarded-for. Configure only a header overwritten by your deployment proxy.
  const value = trustedHeader ? (await headers()).get(trustedHeader)?.slice(0, 128) : null;
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret).update(`${day}:${value ?? "shared-anonymous-bucket"}`).digest("hex");
}
