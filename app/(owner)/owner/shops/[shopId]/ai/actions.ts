"use server";

import { redirect } from "next/navigation";
import { requireShopAccess } from "@/lib/auth";
import { aiConfig, extractOffer } from "@/lib/ai/provider";
import { dateToIndiaBoundary, MAX_SOURCE_BYTES, validateMedia } from "@/lib/ai/extraction";

export type AiState = { error: string; recoveryHref?: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createAiDraft(shopId: string, requestId: string, offerId: string, _state: AiState, form: FormData): Promise<AiState> {
  if (![shopId, requestId, offerId].every(value => uuid.test(value))) return { error: "Invalid request. Reopen the assistant." };
  const { client } = await requireShopAccess(shopId, true);
  const config = aiConfig();
  if (!config) return { error: "AI is not configured. Use the manual offer form." };
  if (form.get("consent") !== "on") return { error: "Confirm that this input may be sent to the AI provider." };
  const mode = String(form.get("mode"));
  const language = String(form.get("language"));
  const text = String(form.get("text") ?? "").trim();
  if (!["text", "photo", "voice"].includes(mode) || !["te", "hi", "en"].includes(language) || text.length > 10000 || (mode === "text" && !text)) return { error: "Choose a language and enter up to 10,000 characters of offer text." };
  let media: { bytes: Uint8Array; type: string } | undefined;
  try {
    if (mode !== "text") {
      const file = form.get("media");
      if (!(file instanceof File) || file.size > MAX_SOURCE_BYTES) return { error: "Choose a photo or audio file smaller than 2 MB." };
      const bytes = new Uint8Array(await file.arrayBuffer());
      media = { bytes, type: validateMedia(bytes, file.type, mode as "photo" | "voice") };
    }
  } catch (error) { return { error: error instanceof Error ? error.message : "Could not read the file. Use manual entry." }; }
  const { data: state, error: reserveError } = await client.rpc("begin_ai_request", { p_shop_id: shopId, p_offer_id: offerId, p_request_id: requestId });
  if (reserveError) return { error: "AI request limit reached or access changed. Try later or use manual entry." };
  if (state === "completed") redirect(`/owner/shops/${shopId}/offers/${offerId}`);
  if (state !== "ready") return { error: "This request was already submitted. Reopen the assistant to start a new attempt." };
  let storagePath: string | null = null;
  let completionAttempted = false;
  let failure = "AI could not create this draft. Reopen the assistant to retry, or enter it manually.";
  try {
    const result = await extractOffer({ mode: mode as "text" | "photo" | "voice", text, language: language as "te" | "hi" | "en", media }, config);
    if (media) {
      const ext: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "audio/webm": "webm", "audio/mp4": "mp4", "audio/mpeg": "mp3", "audio/ogg": "ogg" };
      storagePath = `${shopId}/${requestId}.${ext[media.type]}`;
      const { error } = await client.storage.from("offer-sources").upload(storagePath, media.bytes, { contentType: media.type, upsert: false });
      if (error) throw new Error("Source upload failed");
    }
    const starts = dateToIndiaBoundary(result.fields.starts_on);
    const expires = dateToIndiaBoundary(result.fields.expires_on, true);
    completionAttempted = true;
    const { error } = await client.rpc("complete_ai_draft", {
      p_request_id: requestId,
      p_payload: { title: result.fields.title?.trim() || "Review AI draft", description: result.fields.description, price_minor: result.fields.price_minor,
        quantity: result.fields.quantity !== null && result.fields.unit ? result.fields.quantity : null, unit: result.fields.quantity !== null && result.fields.unit ? result.fields.unit : null,
        starts_at: starts, expires_at: starts && expires && starts >= expires ? null : expires, source_type: mode },
      p_extracted: { fields: result.fields, warnings: result.fields.warnings }, p_transcript: result.transcript,
      ...(storagePath ? { p_storage_path: storagePath } : {}),
    });
    if (error) throw new Error("Draft could not be saved");
    failure = "";
  } catch {
    if (completionAttempted) {
      // A transport failure may follow a committed transaction. Never delete its source.
      // Replay is read-only for an existing request and cannot invoke the provider again.
      let recovered: string | null = null;
      try {
        const result = await client.rpc("begin_ai_request", { p_shop_id: shopId, p_offer_id: offerId, p_request_id: requestId });
        recovered = result.data;
      } catch {
        // The recovery read can also fail; preserve the source for later reconciliation.
      }
      if (recovered === "completed") failure = "";
      else return { error: "We couldn’t confirm whether the draft was saved. Check your drafts before starting another attempt.", recoveryHref: `/owner/shops/${shopId}/offers` };
    } else {
      if (storagePath) await client.storage.from("offer-sources").remove([storagePath]);
      await client.rpc("fail_ai_request", { p_request_id: requestId });
    }
  }
  if (failure) return { error: failure };
  redirect(`/owner/shops/${shopId}/offers/${offerId}`);
}
