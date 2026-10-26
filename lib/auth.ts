import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/owner/login");
  return { client, user };
}

export async function requireShopAccess(shopId: string, editing = false) {
  const { client, user } = await requireUser();
  const { data, error } = await client.from("shop_memberships")
    .select("role").eq("shop_id", shopId).eq("user_id", user.id).maybeSingle();
  if (error || !data || (editing && !["owner", "staff"].includes(data.role))) throw new Error("Shop access denied");
  return { client, user, role: data.role as "owner" | "staff" | "viewer" };
}
