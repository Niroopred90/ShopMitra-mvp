"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireShopAccess } from "@/lib/auth";
import { isUuid, offerPayload } from "@/lib/offers";

export type OfferFormState = { error?: string };

function identifiers(form: FormData) {
  const shopId = String(form.get("shop_id") ?? "");
  const offerId = String(form.get("offer_id") ?? "");
  const requestId = String(form.get("request_id") ?? "");
  const version = Number(form.get("version"));
  if (![shopId, offerId, requestId].every(isUuid) || !Number.isSafeInteger(version) || version < 0) throw new Error("Invalid offer request. Reload the page.");
  return { shopId, offerId, requestId, version };
}
function safeError(error: { code?: string; message?: string } | null) {
  if (error?.code === "40001") return "This offer changed in another session. Reload and review the latest version.";
  if (error?.code === "42501") return "You no longer have permission to update this shop.";
  if (error?.code === "P0001") return error.message ?? "Check your offer details and try again.";
  return "Unable to save the offer. Please retry; the same request will not create a duplicate.";
}

export async function saveDraft(_previous: OfferFormState, form: FormData): Promise<OfferFormState> {
  let ids: ReturnType<typeof identifiers>;
  let payload: ReturnType<typeof offerPayload>;
  try { ids = identifiers(form); payload = offerPayload(form); }
  catch (error) { return { error: error instanceof Error ? error.message : "Check your offer details." }; }
  const { client } = await requireShopAccess(ids.shopId, true);
  const { error } = await client.rpc("save_offer_draft", {
    p_shop_id: ids.shopId, p_offer_id: ids.offerId, p_expected_version: ids.version,
    p_payload: payload, p_request_id: ids.requestId,
  });
  if (error) return { error: safeError(error) };
  revalidatePath("/s", "layout");
  revalidatePath(`/owner/shops/${ids.shopId}/offers`);
  redirect(`/owner/shops/${ids.shopId}/offers/${ids.offerId}`);
}

export async function changePublication(_previous: OfferFormState, form: FormData): Promise<OfferFormState> {
  let ids: ReturnType<typeof identifiers>;
  try { ids = identifiers(form); } catch { return { error: "Invalid offer request. Reload the page." }; }
  const operation = String(form.get("operation"));
  if (operation !== "publish" && operation !== "withdraw") return { error: "Invalid offer action." };
  if (operation === "publish" && form.get("confirmed") !== "yes") return { error: "Confirm that you reviewed the offer details." };
  const { client } = await requireShopAccess(ids.shopId, true);
  const { data: offer } = await client.from("offers").select("shop_id").eq("id", ids.offerId).maybeSingle();
  if (offer?.shop_id !== ids.shopId) return { error: "Offer not found in this shop." };
  const { error } = await client.rpc(operation === "publish" ? "publish_offer" : "withdraw_offer", {
    p_offer_id: ids.offerId, p_expected_version: ids.version, p_request_id: ids.requestId,
  });
  if (error) return { error: safeError(error) };
  revalidatePath("/s", "layout");
  revalidatePath(`/owner/shops/${ids.shopId}/offers`);
  redirect(`/owner/shops/${ids.shopId}/offers/${ids.offerId}?saved=${operation}`);
}
