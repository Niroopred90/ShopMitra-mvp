import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { supabaseConfig } from "@/lib/supabase/config";

type Shop = Database["public"]["Views"]["public_shops"]["Row"];
type Offer = Database["public"]["Views"]["public_offers"]["Row"];
type Storefront = { status: "found"; shop: Shop; offers: Offer[]; demo: boolean }
  | { status: "missing" | "unavailable" };

export const validSlug = (slug: string) => slug.length >= 3 && slug.length <= 100 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);

// Request-only memoization. No cookies/user sessions, privileged keys, or cross-request caching.
export const loadStorefront = cache(async (slug: string): Promise<Storefront> => {
  if (!validSlug(slug)) return { status: "missing" };
  if (slug === "demo-shop") return {
    status: "found", demo: true, offers: [],
    shop: { id: "00000000-0000-0000-0000-000000000000", slug, name: "Demo neighborhood shop", category: "Demo", neighborhood: "Hyderabad", address: "", description: "A preview of the page your customers will see after scanning your shop’s QR." },
  };
  const config = supabaseConfig();
  if (!config) return { status: "unavailable" };
  const client = createClient<Database>(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  try {
    const { data: shop, error } = await client.from("public_shops")
      .select("id, slug, name, category, neighborhood, address, description")
      .eq("slug", slug).abortSignal(AbortSignal.timeout(6000)).maybeSingle();
    if (error) return { status: "unavailable" };
    if (!shop?.id) return { status: "missing" };
    const { data: offers, error: offersError } = await client.from("public_offers")
      .select("id, shop_id, title, description, price_minor, currency, quantity, unit, starts_at, expires_at")
      .eq("shop_id", shop.id).order("expires_at").order("id").abortSignal(AbortSignal.timeout(6000));
    if (offersError) return { status: "unavailable" };
    return { status: "found", shop, offers: offers ?? [], demo: false };
  } catch {
    return { status: "unavailable" };
  }
});

export function storefrontUrl(slug: string): string | null {
  if (!validSlug(slug) || !process.env.SITE_URL) return null;
  try {
    const url = new URL(process.env.SITE_URL);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return new URL(`/s/${slug}`, url.origin).href;
  } catch {
    return null;
  }
}
