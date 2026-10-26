"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { uuid } from "@/lib/discovery";

export async function moderateContent(form: FormData) {
  const { client } = await requireUser();
  const id = String(form.get("id") ?? "");
  const kind = String(form.get("kind") ?? "");
  const visibility = String(form.get("visibility") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (!uuid(id) || !["shop", "offer"].includes(kind) || !["hide", "restore"].includes(visibility) || reason.length < 3 || reason.length > 300) redirect("/admin?error=invalid");
  const { error } = await client.rpc("moderate_content", { p_kind: kind, p_id: id, p_hidden: visibility === "hide", p_reason: reason });
  if (error) redirect("/admin?error=denied");
  revalidatePath("/admin");
  revalidatePath("/nearby");
  revalidatePath("/s/[store-slug]", "page");
  redirect("/admin?success=moderated");
}

export async function reviewReport(form: FormData) {
  const { client } = await requireUser();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!uuid(id) || !["resolved", "dismissed"].includes(status)) redirect("/admin?error=invalid");
  const { error } = await client.rpc("review_offer_report", { p_id: id, p_status: status });
  if (error) redirect("/admin?error=denied");
  revalidatePath("/admin");
  redirect("/admin?success=reviewed");
}
