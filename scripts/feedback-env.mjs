export function validateFeedbackEnv(env) {
  const errors = [];
  const origin = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash
        && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && !url.hostname.endsWith(".localhost") && !/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname);
    } catch { return false; }
  };
  if (!origin(env.NEXT_PUBLIC_SUPABASE_URL)) errors.push("NEXT_PUBLIC_SUPABASE_URL must be the hosted HTTPS Supabase origin, not localhost.");
  if (!origin(env.SITE_URL || env.URL)) errors.push("Set SITE_URL to the feedback site's HTTPS origin (Netlify URL is the fallback).");
  const role = (key) => {
    try { return JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role; } catch { return null; }
  };
  const publicKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!publicKey.startsWith("sb_publishable_") && role(publicKey) !== "anon") errors.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be a public publishable/anon key. Never put a secret/service key here.");
  const secret = env.SUPABASE_SECRET_KEY ?? "";
  if (!secret.startsWith("sb_secret_") && role(secret) !== "service_role") errors.push("Set the server-only SUPABASE_SECRET_KEY for the dedicated feedback project.");
  if ((env.PUBLIC_RATE_SECRET?.length ?? 0) < 32) errors.push("PUBLIC_RATE_SECRET must contain at least 32 random characters.");
  if (env.OPENAI_API_KEY || env.OPENAI_OFFER_MODEL || env.OPENAI_TRANSCRIPTION_MODEL) errors.push("Remove OpenAI keys/models from this free feedback deployment; live AI is disabled.");
  return errors;
}
