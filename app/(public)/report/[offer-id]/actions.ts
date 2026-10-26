"use server";

import { ingestionClient, publicRateKey } from "@/lib/public-ingestion";
import { uuid } from "@/lib/discovery";

export type ReportState = { error?: string; success?: boolean };
export async function submitReport(_previous: ReportState, form: FormData): Promise<ReportState> {
  const offerId = String(form.get("offerId") ?? "");
  const reason = String(form.get("reason") ?? "");
  if (!uuid(offerId) || !["incorrect_price", "unavailable_offer", "misleading", "inappropriate"].includes(reason)) return { error: "Choose a valid reason for this report." };
  const client = ingestionClient();
  if (!client) return { error: "Reporting is temporarily unavailable. Please try again later." };
  try {
    const { error } = await client.rpc("submit_offer_report", { p_offer_id: offerId, p_reason: reason, p_rate_key: await publicRateKey() });
    if (error) return { error: "We couldn’t accept this report. The offer may be unavailable, or you may need to try later." };
    return { success: true };
  } catch {
    return { error: "Reporting is temporarily unavailable. Please try again later." };
  }
}
