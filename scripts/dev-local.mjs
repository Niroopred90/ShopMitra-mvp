import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, chmodSync } from "node:fs";

if (Number(process.versions.node.split(".")[0]) !== 22) throw new Error("Use Node 22 (nvm use) before starting the local stack.");
const engine = spawnSync("docker", ["info", "--format", "{{.ServerVersion}}"], { stdio: "ignore" });
if (engine.status !== 0) throw new Error("Start your Docker-compatible container engine, then retry npm run dev:local.");

function runLocalStep(args, description) {
  console.log(description);
  const result = spawnSync("npx", ["--no-install", "supabase", ...args], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  if (result.status !== 0) {
    mkdirSync(".local-runtime", { recursive: true, mode: 0o700 });
    writeFileSync(".local-runtime/start-error.log", result.stderr ?? "Unable to launch local service", { mode: 0o600 });
    chmodSync(".local-runtime/start-error.log", 0o600);
    throw new Error("Local setup failed. Private diagnostics: .local-runtime/start-error.log");
  }
  return result.stdout;
}

runLocalStep(["start"], "Starting local Supabase (first run may download containers)…");
runLocalStep(["migration", "up", "--local"], "Applying pending local migrations (existing data is retained)…");
const env = spawnSync(process.execPath, ["scripts/local-env.mjs", "--fill-missing"], { stdio: "inherit" });
if (env.status !== 0) process.exit(env.status ?? 1);
const status = JSON.parse(runLocalStep(["status", "--output", "json"], "Verifying local connection settings…"));
if (status.API_URL !== "http://127.0.0.1:54321" || !(status.PUBLISHABLE_KEY ?? status.ANON_KEY) || !(status.SECRET_KEY ?? status.SERVICE_ROLE_KEY)) throw new Error("Expected local Supabase connection settings.");

console.log("Local app: http://127.0.0.1:3000 · Studio: http://127.0.0.1:54323");
console.log("Live AI calls are disabled in dev:local. Supabase data is retained after the app stops.");
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3000"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY ?? status.ANON_KEY,
    SUPABASE_SECRET_KEY: status.SECRET_KEY ?? status.SERVICE_ROLE_KEY,
    NEXT_TELEMETRY_DISABLED: "1",
    SITE_URL: "http://127.0.0.1:3000",
    TRUSTED_CLIENT_IP_HEADER: "",
    OPENAI_API_KEY: "", OPENAI_OFFER_MODEL: "", OPENAI_TRANSCRIPTION_MODEL: "",
  },
});
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
child.on("error", () => { console.error("The local app could not start."); process.exitCode = 1; });
child.on("exit", (code, signal) => { process.exitCode = code ?? (signal ? 130 : 1); });
