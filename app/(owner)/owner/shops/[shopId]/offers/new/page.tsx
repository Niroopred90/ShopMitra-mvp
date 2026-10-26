import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/offers";
import { OfferForm } from "../offer-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create offer", robots: { index: false, follow: false } };

export default async function NewOffer({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  if (!isUuid(shopId)) notFound();
  const { client, user } = await requireUser();
  const { data } = await client.from("shop_memberships").select("role").eq("shop_id", shopId).eq("user_id", user.id).maybeSingle();
  if (!data || data.role === "viewer") notFound();
  return <section className="mx-auto max-w-xl"><Link href={`/owner/shops/${shopId}/offers`} className="underline">← Offers</Link><h1 className="mt-4 text-3xl font-bold">Create an offer</h1><p className="mt-4 text-stone-600">Save a draft, check every detail, then approve publication.</p><OfferForm shopId={shopId} offerId={randomUUID()} version={0} requestId={randomUUID()} values={{ title: "", description: "", price: "", quantity: "", unit: "", start_date: "", end_date: "" }} /></section>;
}
