"use client";

import { useActionState, useState } from "react";
import { createAiDraft } from "./actions";
import Link from "next/link";

export function AiDraftForm({ shopId, requestId, offerId, voiceEnabled }: { shopId: string; requestId: string; offerId: string; voiceEnabled: boolean }) {
  const [mode, setMode] = useState("text");
  const [state, action, pending] = useActionState(createAiDraft.bind(null, shopId, requestId, offerId), { error: "" });
  return <form action={action} className="mt-6 space-y-5">
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-900">{state.error}</p>}
    {state.recoveryHref && <Link href={state.recoveryHref} className="inline-block font-semibold text-emerald-900 underline">Check saved drafts</Link>}
    <div><label htmlFor="mode" className="block font-semibold">How would you like to enter the offer?</label><select id="mode" name="mode" value={mode} onChange={event => setMode(event.target.value)} className="mt-2 w-full rounded-lg border border-stone-400 p-3"><option value="text">Type or paste text</option><option value="photo">Upload a photo</option><option value="voice" disabled={!voiceEnabled}>Upload a voice recording{voiceEnabled ? "" : " (not configured)"}</option></select></div>
    <div><label htmlFor="language" className="block font-semibold">Offer language</label><select id="language" name="language" className="mt-2 w-full rounded-lg border border-stone-400 p-3"><option value="te">Telugu</option><option value="hi">Hindi</option><option value="en">English</option></select></div>
    <div><label htmlFor="text" className="block font-semibold">{mode === "text" ? "Offer text" : "Optional context"}</label><textarea id="text" name="text" required={mode === "text"} maxLength={10000} rows={5} className="mt-2 w-full rounded-lg border border-stone-400 p-3" placeholder="Include price, quantity and validity dates if known." /></div>
    {mode !== "text" && <div><label htmlFor="media" className="block font-semibold">{mode === "photo" ? "Offer photo" : "Voice recording"} (under 2 MB)</label><input key={mode} id="media" name="media" type="file" required accept={mode === "photo" ? "image/jpeg,image/png,image/webp" : "audio/webm,audio/mp4,audio/mpeg,audio/ogg"} capture={mode === "photo" ? "environment" : "user"} className="mt-2 w-full rounded-lg border border-stone-400 p-3" /><p className="mt-2 text-sm text-stone-600">{mode === "voice" ? "Record a short message with your phone, then select the audio file. Use text if recording or upload is unavailable." : "Photograph only the offer; avoid people, phone numbers, or other private information."}</p></div>}
    <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" name="consent" required className="mt-1" /><span>I agree to send this input to the AI provider for extraction. Sources stay private to my shop and support administrators, and are scheduled for deletion after 30 days. I will check every field before publishing.</span></label>
    <button disabled={pending} className="w-full rounded-xl bg-emerald-900 p-4 font-semibold text-white disabled:opacity-60">{pending ? "Preparing a private draft…" : "Create draft for review"}</button>
    <p role="status" className="text-sm text-stone-600">{pending ? "Keep this page open. Your offer will not be published automatically." : "AI can misread prices and dates. This creates a draft only."}</p>
  </form>;
}
