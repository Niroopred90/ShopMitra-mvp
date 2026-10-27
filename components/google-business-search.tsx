"use client";

import { useRef, useState, type FormEvent } from "react";
import { businessCategories, googleMapsSearchUrl } from "@/lib/google-maps-search";
import { SmallIcon } from "@/components/brand-art";

export function GoogleBusinessSearch() {
  const [category, setCategory] = useState("businesses");
  const [mode, setMode] = useState<"pin" | "location">("pin");
  const [pin, setPin] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastSearch, setLastSearch] = useState<string | null>(null);
  const pinInput = useRef<HTMLInputElement>(null);
  const locationRequest = useRef(0);

  function resetResult() { setLastSearch(null); setError(""); }
  function locate() {
    const request = ++locationRequest.current;
    resetResult(); setCoordinates(null);
    if (!navigator.geolocation) { setError("Location isn’t available in this browser. Use a PIN code instead."); return; }
    setLocating(true); setMessage("Requesting your location…");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (request !== locationRequest.current) return;
      setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
      setLocating(false); setMessage("Location ready. Choose Open Google Maps to search around you.");
    }, () => {
      if (request !== locationRequest.current) return;
      setLocating(false); setMessage("");
      setError("Location was unavailable or denied. You can enter a PIN code instead.");
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); resetResult();
    try {
      if (mode === "location" && !coordinates) throw new Error("Choose Use current location first, or search by PIN code.");
      const url = googleMapsSearchUrl(category, mode === "pin" ? { mode, pin } : { mode, ...coordinates! });
      window.open(url, "_blank", "noopener,noreferrer");
      setLastSearch(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Check the location and try again.");
      if (mode === "pin") pinInput.current?.focus();
    }
  }

  return <section aria-labelledby="google-business-heading" className="google-search-panel">
    <p className="page-eyebrow"><SmallIcon kind="pin" /> Explore beyond ShopMitra</p>
    <h2 id="google-business-heading" className="text-2xl font-bold">Find businesses on Google Maps</h2>
    <p className="mt-3 text-sm leading-relaxed text-stone-600">Look for businesses near an Indian PIN code or your current location, including places that haven’t joined ShopMitra.</p>
    <form onSubmit={search} noValidate className="mt-6 space-y-5">
      <div><label htmlFor="google-category" className="block text-sm font-semibold">What are you looking for?</label><select id="google-category" value={category} onChange={event => { setCategory(event.target.value); resetResult(); }} className="mt-2 w-full rounded-xl border p-3">{Object.entries(businessCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <fieldset><legend className="mb-3 text-sm font-semibold">Search around</legend><div className="flex flex-wrap gap-5">{[{ value: "pin" as const, label: "PIN code" }, { value: "location" as const, label: "Current location" }].map(choice => <label key={choice.value} className="flex items-center gap-2 text-sm"><input type="radio" name="google-location-mode" value={choice.value} checked={mode === choice.value} onChange={() => { locationRequest.current++; setMode(choice.value); setLocating(false); setCoordinates(null); setMessage(""); resetResult(); }} className="h-4 w-4 accent-emerald-900" />{choice.label}</label>)}</div></fieldset>
      {mode === "pin" ? <div><label htmlFor="google-pin" className="block text-sm font-semibold">Indian PIN code</label><input ref={pinInput} id="google-pin" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={pin} onChange={event => { setPin(event.target.value); resetResult(); }} placeholder="e.g. 500081" aria-invalid={Boolean(error)} aria-describedby={error ? "google-search-error" : undefined} className="mt-2 w-full rounded-xl border p-3" /></div> : <div><button type="button" onClick={locate} disabled={locating} className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold disabled:opacity-60">{locating ? "Locating…" : "Use current location"}</button>{message && <p role="status" className="mt-3 text-sm text-stone-600">{message}</p>}</div>}
      {error && <p id="google-search-error" role="alert" className="text-sm text-red-800">{error}</p>}
      <button type="submit" disabled={locating} className="button-primary disabled:opacity-60">Open Google Maps <span aria-hidden="true">↗</span></button>
      {lastSearch && <p role="status" className="text-sm text-stone-600">Google Maps should open in another tab. If it didn’t, <a href={lastSearch} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-900 underline">open results here</a>.</p>}
    </form>
    <p className="mt-5 border-t border-stone-200 pt-4 text-xs leading-relaxed text-stone-600">Opening Google Maps shares your search and selected location with Google. We don’t save your location. Google listings aren’t automatically registered shops or verified ShopMitra offers.</p>
  </section>;
}
