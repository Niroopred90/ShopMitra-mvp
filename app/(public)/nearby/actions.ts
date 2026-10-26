"use server";

import { discoveryClient } from "@/lib/discovery";

export type NearbyShop = { id: string; slug: string; name: string; category: string; neighborhood: string; address: string; distance_m: number | null };
export type NearbyState = { error?: string; shops?: NearbyShop[] };

export async function findNearby(_previous: NearbyState, form: FormData): Promise<NearbyState> {
  const neighborhood = String(form.get("neighborhood") ?? "").trim();
  const rawLat = String(form.get("latitude") ?? "");
  const rawLon = String(form.get("longitude") ?? "");
  const lat = rawLat ? Number(rawLat) : null;
  const lon = rawLon ? Number(rawLon) : null;
  if (neighborhood.length > 120 || (lat === null) !== (lon === null)
    || (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon! < -180 || lon! > 180))
    || (!neighborhood && lat === null)) return { error: "Choose a neighborhood or allow location to find shops." };
  const client = discoveryClient();
  if (!client) return { error: "Shop discovery is temporarily unavailable. Please try again later." };
  try {
    const { data, error } = await client.rpc("discover_shops", {
      p_neighborhood: neighborhood || undefined, p_lat: lat ?? undefined, p_lon: lon ?? undefined, p_radius_m: 5000, p_limit: 30,
    });
    if (error) return { error: "We couldn’t load shops. Please try again." };
    return { shops: data ?? [] };
  } catch {
    return { error: "We couldn’t load shops. Please try again." };
  }
}
