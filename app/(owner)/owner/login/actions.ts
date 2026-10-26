"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";

export async function signIn(form: FormData) {
  if (!supabaseConfig()) redirect("/owner/login?error=unavailable");
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1 || password.length > 256) redirect("/owner/login?error=invalid");
  const client = await createClient();
  let failed = false;
  try {
    const { error } = await client.auth.signInWithPassword({ email, password });
    failed = Boolean(error);
  } catch {
    redirect("/owner/login?error=unavailable");
  }
  if (failed) redirect("/owner/login?error=invalid");
  redirect("/owner");
}

export async function signOut() {
  const client = await createClient();
  const { error } = await client.auth.signOut();
  if (error) redirect("/owner?error=signout");
  redirect("/owner/login");
}
