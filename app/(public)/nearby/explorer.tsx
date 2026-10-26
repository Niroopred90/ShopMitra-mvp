"use client";

import { useActionState, useRef, useState } from "react";
import { ShopLink } from "@/components/shop-link";
import { findNearby, type NearbyState } from "./actions";

export function NearbyExplorer({ neighborhoods }: { neighborhoods: string[] }) {
  const [state, action, pending] = useActionState(findNearby, {} as NearbyState);
  const [locationMessage, setLocationMessage] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: string; longitude: string } | null>(null);
  const form = useRef<HTMLFormElement>(null);
  async function locate() {
    setLocationMessage("Requesting your location…");
    if (!navigator.geolocation) {
      setLocationMessage("Location isn’t available. Choose a neighborhood below.");
      return;
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setCoordinates({ latitude: String(coords.latitude), longitude: String(coords.longitude) });
      setLocationMessage("Location ready. Select ‘Find shops’ to search within 5 km.");
      if (form.current) (form.current.elements.namedItem("neighborhood") as HTMLSelectElement).value = "";
    }, () => {
      setCoordinates(null);
      setLocationMessage("Location was unavailable or denied. Choose a neighborhood below.");
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }
  return <section>
    <p className="mt-4 text-stone-600">Choose a neighborhood, or share your location once to find shops within 5 km. Location is used for this search only.</p>
    <button type="button" onClick={locate} className="mt-6 rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold">Use my location</button>
    <p role="status" className="mt-3 text-sm text-stone-600">{locationMessage}</p>
    <form ref={form} action={action} className="mt-6 space-y-4">
      <label htmlFor="neighborhood" className="block font-semibold">Neighborhood</label>
      <select id="neighborhood" name="neighborhood" onChange={() => { setCoordinates(null); setLocationMessage(""); }} className="w-full rounded-xl border border-stone-400 bg-white p-3">
        <option value="">Choose a neighborhood</option>
        {neighborhoods.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
      <input type="hidden" name="latitude" value={coordinates?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={coordinates?.longitude ?? ""} />
      <button disabled={pending} className="rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Finding shops…" : "Find shops"}</button>
    </form>
    {state.error && <p role="alert" className="mt-6 text-red-800">{state.error}</p>}
    {state.shops && <div className="mt-8"><h2 className="text-2xl font-bold">Shops</h2>{state.shops.length ? <ul className="mt-4 space-y-4">{state.shops.map(shop => <li key={shop.id} className="rounded-2xl border border-stone-200 bg-white p-6"><h3 className="text-xl font-bold"><ShopLink href={`/s/${shop.slug}`} className="text-emerald-900 underline">{shop.name}</ShopLink></h3><p className="mt-2">{shop.category} · {shop.neighborhood}</p>{shop.address && <p className="mt-2 text-sm text-stone-600">{shop.address}</p>}{shop.distance_m !== null && <p className="mt-2 text-sm text-stone-600">About {(shop.distance_m / 1000).toFixed(1)} km away</p>}</li>)}</ul> : <p className="mt-4">No public shops found here yet. Try another neighborhood.</p>}</div>}
  </section>;
}
