"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseOwnerSignup, signupCallbackUrl } from "@/lib/owner-signup";

export type SignupState = { error?: string };
export async function signUp(_previous: SignupState, form: FormData): Promise<SignupState> {
  const values = parseOwnerSignup(form);
  if ("error" in values) return { error: values.error };
  const emailRedirectTo = signupCallbackUrl();
  if (!emailRedirectTo) return { error: "Registration is temporarily unavailable. Please try again later." };
  try {
    const client = await createClient();
    const { error } = await client.auth.signUp({ email: values.email, password: values.password, options: { emailRedirectTo } });
    if (error) return { error: "Registration could not be completed. Try again later, or sign in if you already have an account." };
  } catch {
    return { error: "Registration is temporarily unavailable. Please try again later." };
  }
  // Same destination for an existing identity; never disclose account existence.
  redirect("/owner/signup/check-email");
}
