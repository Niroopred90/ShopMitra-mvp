import { SmallIcon } from "@/components/brand-art";
import { discoveryClient } from "@/lib/discovery";
import { NearbyExplorer } from "./explorer";
import { GoogleBusinessSearch } from "@/components/google-business-search";

export const metadata = { title: "Nearby shops" };
export const dynamic = "force-dynamic";

export default async function NearbyPage() {
  const client = discoveryClient();
  const result = client ? await client.from("public_shops").select("neighborhood").limit(1000) : null;
  const neighborhoods = [...new Set((result?.data ?? []).map(shop => shop.neighborhood).filter((value): value is string => Boolean(value)))].sort();
  return <div className="mx-auto max-w-2xl"><p className="page-eyebrow"><SmallIcon kind="pin" /> Around your corner</p><h1 className="page-title">Find neighborhood shops</h1><GoogleBusinessSearch /><section className="mt-10 border-t border-stone-200 pt-8" aria-labelledby="shopmitra-discovery-heading"><h2 id="shopmitra-discovery-heading" className="text-2xl font-bold">ShopMitra shops &amp; offers</h2><p className="mt-2 text-sm text-stone-600">Browse registered shops and offers approved by their owners.</p>{result?.error && <p role="alert" className="mt-4">Neighborhoods are temporarily unavailable. You can try location search or return later.</p>}<NearbyExplorer neighborhoods={neighborhoods} /></section></div>;
}
