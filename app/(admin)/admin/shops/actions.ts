"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { parseShopSetup } from "@/lib/shop-setup";

export type ShopSetupState = { error?: string };
export async function saveShop(_previous: ShopSetupState, form: FormData): Promise<ShopSetupState> {
  const { client } = await requireAdmin();
  const values = parseShopSetup(form);
  if ("error" in values) return { error: values.error };
  const { data, error } = await client.rpc("admin_save_shop", {
    p_shop_id: values.shopId, p_expected_version: values.version, p_payload: values.payload,
    p_owner_lookup: values.ownerLookup ?? undefined, p_verified: values.verified,
    p_verification_method: values.method ?? undefined, p_request_id: values.requestId,
  });
  if (error) {
    if (error.code === "23505") return { error: "That permanent slug is already taken. Choose another slug." };
    if (error.code === "40001") return { error: "This shop changed. Reload the page and review the latest details." };
    if (error.code === "23514") return { error: "The permanent shop slug cannot be changed." };
    if (error.code === "22023") return { error: "Check the shop details and confirm that the owner account already exists and ownership has been independently verified." };
    return { error: "The shop could not be saved. Please check your access and try again later." };
  }
  revalidatePath("/admin");
  revalidatePath("/owner");
  revalidatePath("/nearby");
  revalidatePath("/s/[store-slug]", "page");
  redirect(`/admin/shops/${data}?saved=1`);
}
