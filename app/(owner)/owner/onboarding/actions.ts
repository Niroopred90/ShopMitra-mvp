"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseOwnerShopRequest } from "@/lib/owner-onboarding";

export type OnboardingState = { error?: string };
export async function requestShop(_previous: OnboardingState, form: FormData): Promise<OnboardingState> {
  const { client, user } = await requireUser();
  if (!user.email_confirmed_at) return { error: "Confirm your email before requesting a shop." };
  const values = parseOwnerShopRequest(form);
  if ("error" in values) return { error: values.error };
  const { error } = await client.rpc("submit_owner_shop_request", { p_request_id: values.requestId, p_payload: values.payload });
  if (error) return { error: error.code === "23505" ? "You already have a shop request. Refresh to see its status." : "Your request could not be submitted. Please try again later." };
  revalidatePath("/owner/onboarding");
  revalidatePath("/admin");
  redirect("/owner/onboarding");
}
