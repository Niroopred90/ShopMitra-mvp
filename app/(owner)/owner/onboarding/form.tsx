"use client";

import { useActionState } from "react";
import { requestShop, type OnboardingState } from "./actions";

export function OwnerShopRequestForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(requestShop, {} as OnboardingState);
  const inputClass = "mt-2 block w-full rounded-lg border border-stone-400 p-3 font-normal";
  return <form action={action} className="mt-8 space-y-5">
    <input type="hidden" name="requestId" value={requestId} />
    {state.error && <p role="alert" className="text-red-800">{state.error}</p>}
    <label className="block font-semibold">Shop name<input name="name" required maxLength={120} className={inputClass} /></label>
    <label className="block font-semibold">Category<input name="category" required maxLength={80} className={inputClass} /></label>
    <label className="block font-semibold">Neighborhood<input name="neighborhood" required maxLength={120} className={inputClass} /></label>
    <label className="block font-semibold">Public business address (optional)<input name="address" maxLength={500} className={inputClass} /></label>
    <label className="block font-semibold">Public description (optional)<textarea name="description" maxLength={2000} rows={3} className={inputClass} /></label>
    <p className="text-sm text-stone-600">Use fictional business details for this preview. Do not include private contacts or ownership documents. Review carefully; contact the organizer if a submitted request needs correction.</p>
    <label className="flex items-start gap-3"><input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0" /><span>I am authorized to request this shop and consent to these business details becoming public after ownership approval.</span></label>
    <button disabled={pending} className="button-primary disabled:opacity-60">{pending ? "Submitting…" : "Submit shop for approval"}</button>
  </form>;
}
