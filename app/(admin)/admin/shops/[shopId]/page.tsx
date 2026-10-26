import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { uuid } from "@/lib/discovery";
import { ShopSetupForm } from "../form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit shop details", robots: { index: false, follow: false } };

export default async function EditShopPage({ params, searchParams }: { params: Promise<{ shopId: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { client } = await requireAdmin();
  const { shopId } = await params;
  if (!uuid(shopId)) notFound();
  const { data, error } = await client.rpc("admin_shop_details", { p_shop_id: shopId });
  if (error) return <p role="alert">Shop details could not be loaded. Please try again.</p>;
  const shop = data?.[0];
  if (!shop) notFound();
  return <section className="mx-auto max-w-2xl"><Link href="/admin" className="underline">Back to administration</Link><h1 className="mt-6 text-3xl font-bold">Edit shop details</h1>{(await searchParams).saved === "1" && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4">Shop saved. Its permanent storefront URL is unchanged.</p>}<ShopSetupForm shop={shop} shopId={shopId} requestId={randomUUID()} /></section>;
}
