import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, openSync, closeSync, chmodSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

// Local-only recovery exercise. No production connection strings are accepted.
const mode = process.argv[2];
if (!["backup", "verify"].includes(mode)) throw new Error("Usage: node scripts/local-backup.mjs backup|verify");
const status = JSON.parse(execFileSync("npx", ["--no-install", "supabase", "status", "--output", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
const dbUrl = new URL(status.DB_URL);
if (dbUrl.hostname !== "127.0.0.1" || dbUrl.port !== "54322" || dbUrl.pathname !== "/postgres") throw new Error("Expected the local development database.");
const project = readFileSync("supabase/config.toml", "utf8").match(/^project_id\s*=\s*"([a-zA-Z0-9_-]+)"/m)?.[1];
if (!project) throw new Error("Invalid local project ID.");
const container = `supabase_db_${project}`;
const directory = resolve(".local-backups");
mkdirSync(directory, { recursive: true, mode: 0o700 });
chmodSync(directory, 0o700);
const file = resolve(directory, `shopmitra-${Date.now()}-${randomBytes(4).toString("hex")}.dump`);
const output = openSync(file, "wx", 0o600);
try {
  execFileSync("docker", ["exec", container, "pg_dump", "-U", "postgres", "-d", "postgres", "-Fc", "--no-owner"], { stdio: ["ignore", output, "pipe"] });
} finally { closeSync(output); }
console.log(`Local database backup saved: ${file}`);

if (mode === "verify") {
  const name = `shopmitra_restorecheck_${randomBytes(8).toString("hex")}`;
  const docker = (...args) => execFileSync("docker", ["exec", container, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  let created = false;
  try {
    docker("createdb", "-U", "postgres", "--template=template0", name);
    created = true;
    const input = openSync(file, "r");
    try {
      // Supabase system functions need its local superuser when recreated (e.g. log_min_messages).
      const restore = spawnSync("docker", ["exec", "-i", container, "pg_restore", "-U", "supabase_admin", "-d", name, "--no-owner", "--exit-on-error"], { stdio: [input, "pipe", "pipe"] });
      if (restore.status !== 0) {
        writeFileSync(`${file}.restore-error`, restore.stderr ?? "Restore process failed", { mode: 0o600 });
        throw new Error(`Restore failed. Private diagnostics: ${file}.restore-error`);
      }
    } finally { closeSync(input); }
    const query = "select json_build_object('shops',(select count(*) from public.shops),'offers',(select count(*) from public.offers),'memberships',(select count(*) from public.shop_memberships),'users',(select count(*) from auth.users),'public_offers',(select count(*) from public.public_offers),'anon_base',has_table_privilege('anon','public.offers','SELECT'),'anon_view',has_table_privilege('anon','public.public_offers','SELECT'),'client_direct_write',has_table_privilege('authenticated','public.offers','INSERT'),'anon_admin',has_function_privilege('anon','public.current_user_is_admin()','EXECUTE'),'rls',(select bool_and(relrowsecurity) from pg_class where oid in ('public.shops'::regclass,'public.offers'::regclass,'public.offer_sources'::regclass,'public.shop_memberships'::regclass,'public.audit_events'::regclass)))::text";
    const source = docker("psql", "-U", "postgres", "-d", "postgres", "-Atc", query).trim();
    const restored = docker("psql", "-U", "postgres", "-d", name, "-Atc", query).trim();
    if (source !== restored) throw new Error("Restore row-count verification failed; keep the source unchanged and investigate.");
    console.log("Restore exercise passed: data counts, public projection, RLS flags, and core role grants match.");
  } finally {
    if (created) docker("dropdb", "-U", "postgres", name);
  }
}
