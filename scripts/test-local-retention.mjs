import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "http://127.0.0.1:54321" || !process.env.SUPABASE_SECRET_KEY) {
  throw new Error("This retention test requires local-only server credentials.");
}
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const shop = "20000000-0000-0000-0000-000000000001";
const owner = "10000000-0000-0000-0000-000000000001";
const id = randomUUID();
const path = `${shop}/${id}.png`;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64");
function check(result, label) { if (result.error) throw new Error(label); return result.data; }

try {
  check(await client.from("offers").insert({ id, shop_id: shop, created_by: owner, title: "Synthetic retention test" }), "Could not create synthetic draft.");
  check(await client.storage.from("offer-sources").upload(path, png, { contentType: "image/png" }), "Could not create synthetic source object.");
  check(await client.from("offer_sources").insert({
    offer_id: id, shop_id: shop, storage_path: path, transcript: "Synthetic expired source",
    extracted_fields: { synthetic: true }, corrections: { synthetic: true },
    retained_until: new Date(Date.now() - 86400000).toISOString(),
  }), "Could not create synthetic expired record.");
  execFileSync(process.execPath, ["scripts/cleanup-ai-sources.mjs"], { stdio: ["ignore", "pipe", "pipe"] });
  const row = check(await client.from("offer_sources").select("storage_path,transcript,extracted_fields,corrections").eq("offer_id", id).single(), "Could not verify cleaned source.");
  if (row.storage_path !== null || row.transcript !== null || Object.keys(row.extracted_fields).length || Object.keys(row.corrections).length) throw new Error("Expired private source content was not cleared.");
  const download = await client.storage.from("offer-sources").download(path);
  if (!download.error) throw new Error("Expired source bytes remain downloadable.");
  console.log("Retention smoke test passed: expired source bytes removed and private fields cleared.");
} finally {
  // Only this randomly identified synthetic fixture is removed, even on a failed assertion.
  await client.storage.from("offer-sources").remove([path]);
  check(await client.from("offer_sources").delete().eq("offer_id", id), "Could not clean synthetic source fixture.");
  check(await client.from("offers").delete().eq("id", id), "Could not clean synthetic offer fixture.");
}
