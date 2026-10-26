import { execFileSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";

// Only the public local URL/key are written. Never copy service-role credentials.
if (existsSync(".env.local")) throw new Error(".env.local already exists; refusing to overwrite it.");
const status = JSON.parse(execFileSync("npx", ["--no-install", "supabase", "status", "--output", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
if (status.API_URL !== "http://127.0.0.1:54321") throw new Error("Expected the local Supabase API.");
writeFileSync(".env.local", `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY ?? status.ANON_KEY}\n`, { mode: 0o600, flag: "wx" });
console.log("Created .env.local with local public connection settings.");
