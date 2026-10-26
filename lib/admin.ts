import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseConfig } from "@/lib/supabase/config";

export async function requireAdmin() {
  if (!supabaseConfig()) notFound();
  const context = await requireUser();
  const { data, error } = await context.client.rpc("current_user_is_admin");
  if (error || data !== true) notFound();
  return context;
}
