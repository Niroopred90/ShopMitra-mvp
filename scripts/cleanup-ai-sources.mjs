import { createClient } from "@supabase/supabase-js";

// Run as an operator/scheduled job. Never expose the service key to browser code.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set Supabase URL and server-only SUPABASE_SECRET_KEY.");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const now = new Date().toISOString();
const { data: sources, error } = await client.from("offer_sources").select("offer_id, storage_path").lte("retained_until", now).or("storage_path.not.is.null,transcript.not.is.null").limit(1000);
if (error) throw new Error("Could not query expired source records.");
let count = 0;
for (const source of sources ?? []) {
  if (source.storage_path) {
    const { error: removeError } = await client.storage.from("offer-sources").remove([source.storage_path]);
    if (removeError) throw new Error("Media removal failed; source record retained for retry.");
  }
  const { error: updateError } = await client.from("offer_sources").update({ storage_path: null, transcript: null, extracted_fields: {}, corrections: {} }).eq("offer_id", source.offer_id);
  if (updateError) throw new Error("Source cleanup update failed; retry this job.");
  count++;
}
// Also remove abandoned uploads: paginated bucket traversal, using file creation time.
const cutoff = Date.now() - 30 * 86400000;
let orphanCount = 0;
const folderNames = [];
for (let folderOffset = 0; ; folderOffset += 100) {
  const { data: folders, error: listError } = await client.storage.from("offer-sources").list("", { limit: 100, offset: folderOffset, sortBy: { column: "name", order: "asc" } });
  if (listError) throw new Error("Could not list source folders.");
  for (const folder of folders ?? []) if (!folder.id) folderNames.push(folder.name);
  if (!folders || folders.length < 100) break;
}
for (const folderName of folderNames) {
    const expiredPaths = [];
    for (let offset = 0; ; offset += 100) {
      const { data: files, error: filesError } = await client.storage.from("offer-sources").list(folderName, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
      if (filesError) throw new Error("Could not list source files.");
      for (const file of files ?? []) if (file.id && file.created_at && new Date(file.created_at).getTime() < cutoff) expiredPaths.push(`${folderName}/${file.name}`);
      if (!files || files.length < 100) break;
    }
    if (expiredPaths.length) {
      const { error: removeError } = await client.storage.from("offer-sources").remove(expiredPaths);
      if (removeError) throw new Error("Abandoned media removal failed; retry this job.");
      orphanCount += expiredPaths.length;
    }
}
console.log(`Cleared ${count} expired source records and ${orphanCount} expired/abandoned media objects. Run again if 1000 records were processed.`);
const { error: maintenanceError } = await client.rpc("run_private_maintenance");
if (maintenanceError) throw new Error("Private request-ledger cleanup failed; retry the job.");
