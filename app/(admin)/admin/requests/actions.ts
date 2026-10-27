"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function reviewOwnerRequest(form: FormData) {
  const { client } = await requireAdmin();
  const requestId = String(form.get("requestId") ?? "");
  const decision = String(form.get("decision") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(requestId) || !["approve", "reject"].includes(decision)) redirect("/admin?error=request");
  const { data, error } = await client.rpc("review_owner_shop_request", {
    p_request_id: requestId, p_approve: decision === "approve", p_slug: String(form.get("slug") ?? "").trim(),
    p_verified: form.get("verified") === "on", p_method: String(form.get("method") ?? ""),
  });
  if (error) redirect(`/admin/requests/${requestId}?error=review`);
  for (const path of ["/admin", "/owner", "/owner/onboarding", "/nearby"]) revalidatePath(path);
  redirect(data ? `/admin/shops/${data}?saved=1` : "/admin?success=request");
}
