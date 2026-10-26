"use client";

import { useActionState } from "react";
import { saveShop, type ShopSetupState } from "./actions";
import type { ShopProfile } from "@/lib/shop-setup";

export function ShopSetupForm({ shop, shopId, requestId }: { shop?: ShopProfile; shopId: string; requestId: string }) {
  const [state, action, pending] = useActionState(saveShop, {} as ShopSetupState);
  const inputClass = "mt-2 block w-full rounded-lg border border-stone-400 bg-white p-3 font-normal";
  return <form action={action} className="mt-8 space-y-6">
    <input type="hidden" name="shopId" value={shopId} />
    <input type="hidden" name="requestId" value={requestId} />
    <input type="hidden" name="version" value={shop?.profile_version ?? 0} />
    {state.error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{state.error}</p>}
    <fieldset className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6"><legend className="px-2 text-xl font-bold">Public shop details</legend>
      <label className="block font-semibold">Shop name<input name="name" required maxLength={120} defaultValue={shop?.name} className={inputClass} /></label>
      <label className="block font-semibold">Permanent slug<input name="slug" required minLength={3} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={shop?.slug} readOnly={Boolean(shop)} aria-describedby="slug-help" className={inputClass} /></label>
      <p id="slug-help" className="text-sm text-stone-600">Lowercase letters, numbers, and hyphens. This becomes the permanent QR destination and cannot be changed.</p>
      <label className="block font-semibold">Category<input name="category" required maxLength={80} defaultValue={shop?.category} className={inputClass} /></label>
      <label className="block font-semibold">Neighborhood<input name="neighborhood" required maxLength={120} defaultValue={shop?.neighborhood} className={inputClass} /></label>
      <label className="block font-semibold">Public business address<input name="address" maxLength={500} defaultValue={shop?.address} className={inputClass} /></label>
      <label className="block font-semibold">Public description<textarea name="description" maxLength={2000} defaultValue={shop?.description} rows={3} className={inputClass} /></label>
      <p className="text-sm text-stone-600">Use business information only. Do not enter private owner contacts or verification evidence in public fields.</p>
      <div className="grid gap-5 sm:grid-cols-2"><label className="block font-semibold">Latitude (optional)<input name="latitude" type="number" step="any" min={-90} max={90} defaultValue={shop?.latitude ?? ""} className={inputClass} /></label><label className="block font-semibold">Longitude (optional)<input name="longitude" type="number" step="any" min={-180} max={180} defaultValue={shop?.longitude ?? ""} className={inputClass} /></label></div>
      <p className="text-sm text-stone-600">Supply both coordinates for location discovery, or leave both blank. Neighborhood discovery works without coordinates.</p>
      <div className="block font-semibold"><label htmlFor="shop-visibility">Public availability</label><select id="shop-visibility" name="visibility" defaultValue={shop?.visibility ?? "hidden"} className={inputClass}><option value="hidden">Hidden while setting up</option><option value="public">Public storefront</option></select></div>
    </fieldset>
    <fieldset className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6"><legend className="px-2 text-xl font-bold">{shop ? "Add verified owner access (optional)" : "Verify initial owner access"}</legend>
      <p className="text-sm text-stone-600">Use an existing Supabase Auth account. This form does not register, invite, or email anyone. Confirm control of the business independently before granting access. Existing owners retain their access.</p>
      <label className="block font-semibold">Existing owner account email or UUID<input name="ownerLookup" required={!shop} autoComplete="off" maxLength={254} className={inputClass} /></label>
      <div className="block font-semibold"><label htmlFor="verification-method">Verification method</label><select id="verification-method" name="verificationMethod" defaultValue="" required={!shop} className={inputClass}><option value="">Choose how ownership was verified</option><option value="in_person">In-person confirmation</option><option value="agreed_callback">Previously agreed owner callback</option></select></div>
      <label className="flex items-start gap-3 text-sm"><input name="verified" type="checkbox" required={!shop} className="mt-1 h-5 w-5" /><span>I independently verified that this account belongs to someone authorized to control this business and confirmed their consent to access the pilot.</span></label>
      <p className="text-sm text-stone-600">Only the verification method, account UUID, and admin action are retained internally. No account email is copied into the shop profile.</p>
    </fieldset>
    <button disabled={pending} className="rounded-xl bg-emerald-900 px-6 py-4 font-semibold text-white disabled:opacity-60">{pending ? "Saving shop…" : shop ? "Save shop details" : "Create verified shop"}</button>
  </form>;
}
