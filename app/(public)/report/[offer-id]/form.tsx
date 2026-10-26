"use client";

import { useActionState } from "react";
import { submitReport, type ReportState } from "./actions";

export function ReportForm({ offerId }: { offerId: string }) {
  const [state, action, pending] = useActionState(submitReport, {} as ReportState);
  if (state.success) return <p role="status" className="mt-6 rounded-xl bg-emerald-50 p-5">Thank you. Your report has been sent for review.</p>;
  return <form action={action} className="mt-6 space-y-5">
    <input type="hidden" name="offerId" value={offerId} />
    <label htmlFor="reason" className="block font-semibold">What is the issue?</label>
    <select id="reason" name="reason" required className="w-full rounded-xl border border-stone-400 bg-white p-3"><option value="">Choose a reason</option><option value="incorrect_price">Incorrect price</option><option value="unavailable_offer">Offer is unavailable</option><option value="misleading">Misleading offer</option><option value="inappropriate">Inappropriate content</option></select>
    {state.error && <p role="alert" className="text-red-800">{state.error}</p>}
    <button disabled={pending} className="rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Sending report…" : "Send report"}</button>
  </form>;
}
