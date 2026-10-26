"use client";

import { useActionState } from "react";
import { saveDraft, changePublication } from "./actions";

type Values = { title: string; description: string; price: string; quantity: string; unit: string; start_date: string; end_date: string };
export function OfferForm({ shopId, offerId, version, requestId, values }: { shopId: string; offerId: string; version: number; requestId: string; values: Values }) {
  const [state, action, pending] = useActionState(saveDraft, {});
  const fields: { name: keyof Values; label: string; max?: number; type?: string }[] = [
    { name: "title", label: "Offer title", max: 160 }, { name: "price", label: "Price (INR)" },
    { name: "quantity", label: "Quantity (optional)" }, { name: "unit", label: "Unit (optional)", max: 40 },
    { name: "start_date", label: "Start date (optional)", type: "date" }, { name: "end_date", label: "End date", type: "date" },
  ];
  return <form action={action} className="mt-6 space-y-5">
    <input type="hidden" name="shop_id" value={shopId} /><input type="hidden" name="offer_id" value={offerId} /><input type="hidden" name="version" value={version} /><input type="hidden" name="request_id" value={requestId} />
    {state.error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">{state.error}</p>}
    {fields.map(field => <div key={field.name}><label htmlFor={field.name} className="block font-semibold">{field.label}</label><input id={field.name} name={field.name} type={field.type ?? "text"} inputMode={field.name === "price" || field.name === "quantity" ? "decimal" : undefined} defaultValue={values[field.name]} maxLength={field.max ?? (field.type === "date" ? undefined : 20)} required={field.name === "title"} className="mt-2 w-full rounded-lg border border-stone-400 bg-white p-3" /></div>)}
    <div><label htmlFor="description" className="block font-semibold">Description (optional)</label><textarea id="description" name="description" defaultValue={values.description} maxLength={3000} rows={4} className="mt-2 w-full rounded-lg border border-stone-400 bg-white p-3" /></div>
    <p className="text-sm text-stone-600">Dates use India time. Offers end at midnight after the selected end date. Saving changes returns an offer to draft; review and publish it again.</p>
    <button disabled={pending} className="rounded-xl bg-emerald-900 px-6 py-4 font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : "Save draft and review"}</button>
  </form>;
}

export function PublicationForm({ shopId, offerId, version, requestId, operation }: { shopId: string; offerId: string; version: number; requestId: string; operation: "publish" | "withdraw" }) {
  const [state, action, pending] = useActionState(changePublication, {});
  return <form action={action} className="mt-5 space-y-4">
    <input type="hidden" name="shop_id" value={shopId} /><input type="hidden" name="offer_id" value={offerId} /><input type="hidden" name="version" value={version} /><input type="hidden" name="request_id" value={requestId} /><input type="hidden" name="operation" value={operation} />
    {operation === "publish" && <label className="flex items-start gap-3"><input name="confirmed" type="checkbox" value="yes" required className="mt-1 h-5 w-5" /><span>I have reviewed the price, quantity, and dates and approve this offer for customers.</span></label>}
    {state.error && <p role="alert" className="text-red-800">{state.error}</p>}
    <button disabled={pending} className="rounded-xl border border-emerald-900 bg-white px-5 py-3 font-semibold text-emerald-900 disabled:opacity-50">{pending ? "Updating…" : operation === "publish" ? "Publish reviewed offer" : "Withdraw offer"}</button>
  </form>;
}
