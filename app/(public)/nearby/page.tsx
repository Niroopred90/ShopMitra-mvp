import { SmallIcon } from "@/components/brand-art";
import { discoveryClient } from "@/lib/discovery";
import { NearbyExplorer } from "./explorer";

export const metadata = { title: "Nearby shops" };
export const dynamic = "force-dynamic";

export default async function NearbyPage() {
  const client = discoveryClient();
  const result = client ? await client.from("public_shops").select("neighborhood").limit(1000) : null;
  const neighborhoods = [...new Set((result?.data ?? []).map(shop => shop.neighborhood).filter((value): value is string => Boolean(value)))].sort();
  return <div className="mx-auto max-w-2xl"><p className="page-eyebrow"><SmallIcon kind="pin" /> Around your corner</p><h1 className="page-title">Find neighborhood shops</h1>{result?.error && <p role="alert" className="mt-4">Neighborhoods are temporarily unavailable. You can try location search or return later.</p>}<NearbyExplorer neighborhoods={neighborhoods} /></div>;
}
