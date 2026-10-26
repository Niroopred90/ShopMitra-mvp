import { execFileSync } from "node:child_process";
import { writeFileSync, existsSync, readFileSync, chmodSync } from "node:fs";
import { randomBytes } from "node:crypto";

// Only local credentials are written to ignored .env.local; no hosted secrets are read.
const existing = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : null;
const fillMissing = process.argv.includes("--fill-missing");
if (existing !== null && !fillMissing) throw new Error(".env.local already exists; use --fill-missing to add missing local settings.");
if (existing !== null && !/^NEXT_PUBLIC_SUPABASE_URL=http:\/\/127\.0\.0\.1:54321\s*$/m.test(existing)) throw new Error("Refusing to modify settings for a non-local database.");
const status = JSON.parse(execFileSync("npx", ["--no-install", "supabase", "status", "--output", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
if (status.API_URL !== "http://127.0.0.1:54321") throw new Error("Expected the local Supabase API.");
const values = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY ?? status.ANON_KEY,
  SUPABASE_SECRET_KEY: status.SECRET_KEY ?? status.SERVICE_ROLE_KEY,
  PUBLIC_RATE_SECRET: randomBytes(32).toString("hex"),
  SITE_URL: "http://127.0.0.1:3000",
};
const additions = Object.entries(values).filter(([key]) => !new RegExp(`^${key}=`, "m").test(existing ?? "")).map(([key, value]) => `${key}=${value}`).join("\n");
writeFileSync(".env.local", `${existing?.trimEnd() ?? ""}\n${additions}\n`, { mode: 0o600, flag: existing === null ? "wx" : "w" });
chmodSync(".env.local", 0o600);
console.log("Created private .env.local with local connection settings.");
